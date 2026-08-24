import { Request, Response } from "express";
import {
  ensureShopifyOrderWebhooks,
  getStoresByUserId,
  integrateWithMagento,
  integrateWithShopify,
  integrateWithWix,
  integrateWithWooCommerce,
  normalizeShopifyDomain,
  upsertShopifySettingsMetafield,
} from "../models/services/PlatformIntegration.service";
import { exchangeShopifyClientCredentials, syncShopifyOrdersForUser } from "../models/services/shopify.service";
import {
  updateUserChannelIntegration,
  upsertStore,
} from "../models/services/userService";
import { db } from "../models/client";
import { stores } from "../schema/schema";
import { eq } from "drizzle-orm";

const summarizeShopifyError = (error: any) => ({
  message: error?.message || "Unknown Shopify error",
  status: error?.response?.status ?? error?.status ?? null,
  code: error?.code ?? null,
  response: error?.response?.data ?? null,
});

/**
 * Enum for supported platforms
 */
enum PLATFORMS {
  SHOPIFY = 1,
  WOOCOMMERCE = 2,
  AMAZON = 3,
  MAGENTO = 4,
  WIX,
}

const getStoreWebhookSecret = (store: any) => {
  const metadata = store?.metadata || {};
  return String(
    metadata?.shopifyWebhookSecret ||
      metadata?.webhookSecret ||
      metadata?.apiSecret ||
      metadata?.apiSecretKey ||
      ""
  ).trim();
};

const sanitizeStoreForResponse = (store: any) => {
  const { apiKey, adminApiAccessToken, metadata: rawMetadata, ...publicStore } = store;
  const metadata =
    rawMetadata && typeof rawMetadata === "object" && !Array.isArray(rawMetadata)
      ? { ...rawMetadata }
      : rawMetadata;

  if (metadata && typeof metadata === "object" && !Array.isArray(metadata)) {
    [
      "apiKey",
      "adminApiAccessToken",
      "shopifyWebhookSecret",
      "webhookSecret",
      "apiSecret",
      "apiSecretKey",
    ].forEach((key) => delete (metadata as Record<string, unknown>)[key]);
  }

  return {
    ...publicStore,
    metadata,
    hasApiKey: Boolean(String(apiKey || "").trim()),
    hasAdminApiAccessToken: Boolean(String(adminApiAccessToken || "").trim()),
    hasWebhookSecret: Boolean(getStoreWebhookSecret(store)),
  };
};

const firstNonBlank = (...values: any[]) => {
  const match = values.find((value) => String(value ?? "").trim());
  return String(match ?? "").trim();
};

const shopifyIntegrationErrorStatus = (message: string) => {
  if (/already connected to another merchant/i.test(message)) return 409;
  if (
    /Shopify returned 4\d\d|valid Shopify|credentials do not match|required|missing/i.test(
      message
    )
  ) {
    return 400;
  }
  return 500;
};

/**
 * Handles Shopify store integration using user-provided credentials
 */

export const integrateShopifyStore = async (
  req: Request,
  res: Response
): Promise<any> => {
  const {
    storeUrl,
    domain,
    apiKey,
    api_key,
    clientId,
    client_id,
    clientSecret,
    client_secret,
    adminApiAccessToken,
    adminAccessToken,
    accessToken,
    token,
    password,
    apiPassword,
    adminApiPassword,
    webhookSecret,
    shopifyWebhookSecret,
    apiSecret,
    apiSecretKey,
    userId: bodyUserId,
    status,
    id,
    settings,
  } = req.body || {};
  const userId = (req as any)?.user?.sub || bodyUserId;

  if (!userId) {
    return res.status(400).json({ error: "Missing required Shopify fields: user account" });
  }

  try {
    const requestedStoreId = String(id || "").trim();
    const [storeForUpdate] = requestedStoreId
      ? await db.select().from(stores).where(eq(stores.id, requestedStoreId)).limit(1)
      : [];

    if (requestedStoreId && !storeForUpdate) {
      return res.status(404).json({ error: "Shopify store not found" });
    }

    if (storeForUpdate && storeForUpdate.userId !== userId) {
      return res.status(403).json({ error: "You cannot update this Shopify store" });
    }

    const effectiveStoreUrl = normalizeShopifyDomain(
      firstNonBlank(storeUrl, domain, storeForUpdate?.domain)
    );
    const effectiveApiKey = firstNonBlank(apiKey, api_key, clientId, client_id, storeForUpdate?.apiKey);
    const effectiveClientSecret = firstNonBlank(
      clientSecret,
      client_secret,
      webhookSecret,
      shopifyWebhookSecret,
      apiSecret,
      apiSecretKey,
      getStoreWebhookSecret(storeForUpdate)
    );
    let effectiveAdminApiAccessToken = firstNonBlank(
      adminApiAccessToken,
      adminAccessToken,
      accessToken,
      token,
      apiPassword,
      adminApiPassword,
      password,
      storeForUpdate?.adminApiAccessToken
    );
    const effectiveWebhookSecret = effectiveClientSecret;

    const missingFields: string[] = [];
    if (!effectiveStoreUrl) missingFields.push("Shopify store URL");
    if (!firstNonBlank(effectiveAdminApiAccessToken, effectiveApiKey)) {
      missingFields.push("Client ID or Admin API access token");
    }
    if (!firstNonBlank(effectiveAdminApiAccessToken, effectiveClientSecret)) {
      missingFields.push("Client secret");
    }

    if (missingFields.length) {
      return res.status(400).json({
        error: `Missing required Shopify fields: ${missingFields.join(", ")}`,
        missingFields,
      });
    }

    let tokenExchangeWarning: string | null = null;
    if (!effectiveAdminApiAccessToken && effectiveApiKey && effectiveClientSecret) {
      try {
        const tokenResponse = await exchangeShopifyClientCredentials({
          shop: effectiveStoreUrl,
          clientId: effectiveApiKey,
          clientSecret: effectiveClientSecret,
        });
        effectiveAdminApiAccessToken = firstNonBlank(tokenResponse?.access_token);
        if (!effectiveAdminApiAccessToken) {
          throw new Error("Shopify did not return an Admin API access token");
        }
      } catch (error: any) {
        const message = error?.response?.data?.error_description || error?.response?.data?.error || error?.message;
        throw new Error(`Shopify client credentials token exchange failed: ${message || "unknown error"}`);
      }
    } else if (effectiveAdminApiAccessToken) {
      tokenExchangeWarning = "Connected using the supplied Admin API access token.";
    }

    const shopifyData = await integrateWithShopify(
      effectiveStoreUrl,
      effectiveApiKey,
      effectiveAdminApiAccessToken
    );
    if (!shopifyData?.shop?.id) {
      return res.status(500).json({ error: "Shopify integration failed" });
    }

    const storeId = String(shopifyData.shop.id);
    const shopifyAuthMode = shopifyData.shopifyAuthMode || "access_token";
    const resolvedApiKey = firstNonBlank(shopifyData.shopifyApiKey, effectiveApiKey);
    const resolvedAdminApiAccessToken = firstNonBlank(
      shopifyData.shopifyAdminApiAccessToken,
      effectiveAdminApiAccessToken
    );
    if (requestedStoreId && requestedStoreId !== storeId) {
      return res.status(400).json({ error: "Shopify credentials do not match the selected store" });
    }

    let settingsWarning: string | null = null;

    await db.transaction(async (tx) => {
      const existingStore = await tx
        .select()
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);

      if (existingStore.length > 0 && existingStore[0]?.userId !== userId) {
        throw new Error("This Shopify store is already connected to another merchant account");
      }

      await upsertStore(
        {
          ...shopifyData.shop,
          id: storeId,
          apiKey: resolvedApiKey || "",
          adminApiAccessToken: resolvedAdminApiAccessToken,
          shopifyWebhookSecret: effectiveWebhookSecret || "",
          shopifyAuthMode,
        },
        PLATFORMS.SHOPIFY,
        userId,
        tx
      );

      const updated = await updateUserChannelIntegration(
        userId,
        PLATFORMS.SHOPIFY,
        tx
      );
      if (!updated?.length) throw new Error("Failed to update sales channels");

      if (settings) {
        const settingsSync = await upsertShopifySettingsMetafield({
          storeUrl: shopifyData.shop.domain || effectiveStoreUrl,
          accessToken: resolvedAdminApiAccessToken,
          apiKey: resolvedApiKey,
          authMode: shopifyAuthMode,
          settings,
          id: storeId,
          tx,
        });
        settingsWarning = settingsSync.warning || null;
      }
    });

    let webhookStatus: { address: string; subscribed: string[] } | null = null
    let webhookWarning: string | null = null
    if (effectiveWebhookSecret || process.env.SHOPIFY_WEBHOOK_SECRET) {
      try {
        webhookStatus = await ensureShopifyOrderWebhooks({
          storeUrl: shopifyData.shop.domain || effectiveStoreUrl,
          accessToken: resolvedAdminApiAccessToken,
          apiKey: resolvedApiKey,
          authMode: shopifyAuthMode,
        })
      } catch (err: any) {
        console.warn('Shopify webhook setup failed:', err?.response?.data || err?.message || err)
        webhookWarning = 'Store connected, but Shopify webhooks could not be auto-configured'
      }
    } else {
      webhookWarning =
        'Store connected. Add the Shopify API secret key later to enable webhook auto-sync.'
    }

    let syncResult: any = null;
    let syncWarning: string | null = null;
    try {
      syncResult = await syncShopifyOrdersForUser(userId, 50, storeId);
    } catch (error: any) {
      syncWarning = error?.message
        ? `Store connected, but initial 30-day unbooked order sync failed: ${error.message}`
        : "Store connected, but initial 30-day unbooked order sync failed";
    }

    res.status(200).json({
      message: "Shopify integration successful!",
      data: {
        shop: {
          id: storeId,
          name: shopifyData.shop.name,
          domain: shopifyData.shop.domain,
          myshopify_domain: shopifyData.shop.myshopify_domain,
        },
      },
      sync: syncResult,
      webhooks: webhookStatus,
      warning: [settingsWarning, webhookWarning, syncWarning, tokenExchangeWarning].filter(Boolean).join(" ") || null,
    });
  } catch (error: any) {
    console.error("❌ Error integrating Shopify:", summarizeShopifyError(error));
    const message = error?.message || "Failed to integrate Shopify store";
    res.status(shopifyIntegrationErrorStatus(message)).json({ error: message });
  }
};

export const integrateWooCommerceStore = async (
  req: Request,
  res: Response
): Promise<any> => {
  const {
    storeUrl,
    consumerKey,
    consumerSecret,
    userId: bodyUserId,
    status = "active",
  } = req.body;
  const userId = (req as any)?.user?.sub || bodyUserId;

  if (!storeUrl || !consumerKey || !consumerSecret || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const wooData = await integrateWithWooCommerce(
      storeUrl,
      consumerKey,
      consumerSecret
    );

    const storeId = `woo_${userId}_${storeUrl}`; // generate a unique store ID

    await db.transaction(async (tx) => {
      const existingStore = await tx
        .select()
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);

      if (existingStore.length === 0) {
        await upsertStore(
          {
            id: storeId,
            domain: storeUrl,
            name: wooData.storeName,
            apiKey: consumerKey,
            adminApiAccessToken: consumerSecret,
          },
          PLATFORMS.WOOCOMMERCE,
          userId,
          tx
        );

        const updated = await updateUserChannelIntegration(
          userId,
          PLATFORMS.WOOCOMMERCE,
          tx
        );
        if (!updated) throw new Error("Failed to update sales channels");
      }
    });

    res.status(200).json({
      message: "WooCommerce integration successful!",
      data: wooData,
    });
  } catch (error) {
    console.error("❌ Error integrating WooCommerce:", error);
    res.status(500).json({ error: "Failed to integrate WooCommerce store" });
  }
};

export const integrateWixStore = async (req: Request, res: Response) => {
  console.log("==================");
  const { storeUrl, accessToken, userId: bodyUserId, status = "active" } = req.body;
  const userId = (req as any)?.user?.sub || bodyUserId;
  console.log("access token", accessToken, "user id", userId);

  if (!accessToken || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const wixData = await integrateWithWix(storeUrl, accessToken);
    const storeId = `wix_${userId}_${storeUrl}`;

    await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);

      if (!existing.length) {
        await upsertStore(
          {
            id: storeId,
            domain: storeUrl,
            name: "Wix Store",
            adminApiAccessToken: accessToken,
          },
          PLATFORMS.WIX,
          userId,
          tx
        );

        const updated = await updateUserChannelIntegration(
          userId,
          PLATFORMS.WIX,
          tx
        );
        if (!updated) throw new Error("Failed to update sales channels");
      }
    });

    res.status(200).json({
      message: "Wix integration successful!",
      data: wixData,
    });
  } catch (error) {
    console.error("❌ Error integrating Wix:", error);
    res.status(500).json({ error: "Failed to integrate Wix store" });
  }
};
export const integrateMagentoStore = async (req: Request, res: Response) => {
  const { storeUrl, accessToken, userId: bodyUserId, status = "active" } = req.body;
  const userId = (req as any)?.user?.sub || bodyUserId;

  if (!storeUrl || !accessToken || !userId) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    const magentoData = await integrateWithMagento(storeUrl, accessToken);
    const storeId = `magento_${userId}_${storeUrl}`;

    await db.transaction(async (tx) => {
      const existing = await tx
        .select()
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);

      if (!existing.length) {
        await upsertStore(
          {
            id: storeId,
            domain: storeUrl,
            name: "Magento Store",
            adminApiAccessToken: accessToken,
          },
          4, // Magento
          userId,
          tx
        );

        const updated = await updateUserChannelIntegration(userId, 4, tx);
        if (!updated) throw new Error("Failed to update sales channels");
      }
    });

    res.status(200).json({
      message: "Magento integration successful!",
      data: magentoData,
    });
  } catch (error) {
    console.error("❌ Magento integration error:", error);
    res.status(500).json({ error: "Failed to integrate Magento store" });
  }
};

export const getUserStoreIntegrations = async (
  req: any,
  res: Response
): Promise<any> => {
  const userId = req.user.sub;

  if (!userId) {
    return res.status(400).json({ error: "Missing userId" });
  }

  try {
    const stores = await getStoresByUserId(userId);

    res.status(200).json({
      success: true,
      data: stores.map(sanitizeStoreForResponse),
    });
  } catch (error) {
    console.error("Error fetching store integrations:", error);
    res.status(500).json({ error: "Internal server error" });
  }
};
