-- Check why COD remittance wasn't created for this order
-- Run this in your database to diagnose:

-- 1. Check order details
SELECT 
    id,
    order_number,
    awb_number,
    status,           -- ← Is this 'delivered'?
    order_type,       -- ← Is this 'cod'?
    order_amount,
    created_at,
    updated_at
FROM b2c_orders 
WHERE awb_number = '43493010000044';

-- 2. Check if COD remittance exists
SELECT 
    id,
    order_number,
    awb_number,
    status,
    cod_amount,
    remittable_amount,
    created_at
FROM cod_remittances 
WHERE awb_number = '43493010000044';

-- 3. Check recent COD remittances to see if any exist
SELECT 
    id,
    order_number,
    awb_number,
    status,
    cod_amount,
    created_at
FROM cod_remittances 
ORDER BY created_at DESC 
LIMIT 10;

-- EXPECTED RESULTS:
-- If order.status != 'delivered' → Order not delivered yet
-- If order.order_type != 'cod' → Not a COD order  
-- If cod_remittances is empty → Remittance not created (webhook issue)

