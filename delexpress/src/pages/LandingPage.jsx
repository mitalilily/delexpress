import { useEffect, useRef, useState } from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import CalculatorSection from "../components/landing/CalculatorSection";
import CommerceSections from "../components/landing/CommerceSections";
import HeroSection from "../components/landing/HeroSection";
import LandingFooter from "../components/landing/LandingFooter";
import LandingHeader from "../components/landing/LandingHeader";
import { MotionProvider } from "../components/landing/LandingPrimitives";
import OperationsSections from "../components/landing/OperationsSections";
import PincodeServiceabilitySection from "../components/landing/PincodeServiceabilitySection";
import ScrollProgress from "../components/landing/ScrollProgress";
import SocialSections from "../components/landing/SocialSections";
import { footerGroups, footerMeta, navigationLinks } from "../utils/landingContent";
import theme from "../utils/muiTheme";
import {
  calculateWeightBreakdown,
  fetchGuestRateEstimate,
  fetchPincodeLocation,
} from "../utils/rateCalculatorApi";

function LandingPage() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [shippingForm, setShippingForm] = useState({
    packageWeight: "",
    pickupPincode: "",
    deliveryPincode: "",
    orderAmount: "",
    paymentType: "prepaid",
    length: "10",
    breadth: "10",
    height: "10",
  });
  const [rateOptions, setRateOptions] = useState([]);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoadingRates, setIsLoadingRates] = useState(false);
  const [hasCheckedRates, setHasCheckedRates] = useState(false);
  const [pincodeLookup, setPincodeLookup] = useState({
    pickup: { isLoading: false, location: null, error: "" },
    delivery: { isLoading: false, location: null, error: "" },
  });
  const abortRef = useRef(null);
  const pincodeAbortRefs = useRef({ pickup: null, delivery: null });
  const { pickupPincode, deliveryPincode } = shippingForm;

  const handleFieldChange = (key) => (event) => {
    setShippingForm((current) => ({
      ...current,
      [key]: event.target.value,
    }));
  };

  useEffect(() => {
    const lookupConfig = [
      { pincodeValue: pickupPincode, key: "pickup" },
      { pincodeValue: deliveryPincode, key: "delivery" },
    ];

    const cleanups = lookupConfig.map(({ pincodeValue, key }) => {
      const pincode = String(pincodeValue || "").trim();

      if (pincodeAbortRefs.current[key]) {
        pincodeAbortRefs.current[key].abort();
        pincodeAbortRefs.current[key] = null;
      }

      if (!pincode) {
        setPincodeLookup((current) => ({
          ...current,
          [key]: { isLoading: false, location: null, error: "" },
        }));
        return () => {};
      }

      if (!/^\d{6}$/.test(pincode)) {
        setPincodeLookup((current) => ({
          ...current,
          [key]: { isLoading: false, location: null, error: "Enter a valid 6-digit pincode." },
        }));
        return () => {};
      }

      setPincodeLookup((current) => ({
        ...current,
        [key]: { ...current[key], isLoading: true, error: "", location: null },
      }));

      const controller = new AbortController();
      pincodeAbortRefs.current[key] = controller;

      const timeoutId = window.setTimeout(async () => {
        try {
          const location = await fetchPincodeLocation(pincode, controller.signal);

          setPincodeLookup((current) => ({
            ...current,
            [key]: location
              ? { isLoading: false, location, error: "" }
              : { isLoading: false, location: null, error: "Pincode not found in our serviceability locations." },
          }));
        } catch (error) {
          if (error?.name === "AbortError") return;

          setPincodeLookup((current) => ({
            ...current,
            [key]: {
              isLoading: false,
              location: null,
              error: error?.message || "Unable to verify this pincode right now.",
            },
          }));
        } finally {
          if (pincodeAbortRefs.current[key] === controller) {
            pincodeAbortRefs.current[key] = null;
          }
        }
      }, 250);

      return () => {
        window.clearTimeout(timeoutId);
        controller.abort();
      };
    });

    return () => {
      cleanups.forEach((cleanup) => cleanup());
    };
  }, [deliveryPincode, pickupPincode]);

  const handleCalculateRates = async () => {
    if (abortRef.current) {
      abortRef.current.abort();
    }

    const controller = new AbortController();
    abortRef.current = controller;

    setIsLoadingRates(true);
    setErrorMessage("");
    setHasCheckedRates(true);

    try {
      const results = await fetchGuestRateEstimate(shippingForm, controller.signal);
      const sorted = [...results].sort((left, right) => {
        const leftRate = Number(left?.rate ?? left?.courier_cost_estimate ?? Number.POSITIVE_INFINITY);
        const rightRate = Number(right?.rate ?? right?.courier_cost_estimate ?? Number.POSITIVE_INFINITY);
        return leftRate - rightRate;
      });
      setRateOptions(sorted);
    } catch (error) {
      if (error?.name === "AbortError") return;
      setRateOptions([]);
      setErrorMessage(error?.message || "Unable to fetch shipping rates right now.");
    } finally {
      if (abortRef.current === controller) {
        abortRef.current = null;
      }
      setIsLoadingRates(false);
    }
  };

  const bestRateOption = rateOptions[0];
  const weightBreakdown = calculateWeightBreakdown(shippingForm);
  const hasValidPincodes =
    Boolean(pincodeLookup.pickup.location) && Boolean(pincodeLookup.delivery.location);
  const rateSummary = {
    bestRate: Number(bestRateOption?.rate ?? bestRateOption?.courier_cost_estimate ?? 0),
    totalOptions: rateOptions.length,
    zoneName: bestRateOption?.approxZone?.name || "",
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <MotionProvider>
        <div className="page-shell min-h-screen">
          <ScrollProgress />
          <LandingHeader
            menuOpen={menuOpen}
            navigationLinks={navigationLinks}
            onToggleMenu={() => setMenuOpen((open) => !open)}
            onCloseMenu={() => setMenuOpen(false)}
          />

          <main id="top">
            <HeroSection />
            <CommerceSections
              afterToolsContent={
                <>
                  <PincodeServiceabilitySection
                    onFieldChange={handleFieldChange}
                    pincodeLookup={pincodeLookup}
                    shippingForm={shippingForm}
                  />
                  <CalculatorSection
                    errorMessage={errorMessage}
                    hasCheckedRates={hasCheckedRates}
                    isLoading={isLoadingRates}
                    onCalculate={handleCalculateRates}
                    pincodeLookup={pincodeLookup}
                    rateOptions={rateOptions}
                    rateSummary={rateSummary}
                    shippingForm={shippingForm}
                    weightBreakdown={weightBreakdown}
                    onFieldChange={handleFieldChange}
                    hasValidPincodes={hasValidPincodes}
                  />
                </>
              }
            />
            <OperationsSections />
            <SocialSections />
          </main>

          <LandingFooter footerGroups={footerGroups} footerMeta={footerMeta} />
        </div>
      </MotionProvider>
    </ThemeProvider>
  );
}

export default LandingPage;
