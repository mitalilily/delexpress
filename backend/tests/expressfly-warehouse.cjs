const assert = require('node:assert/strict')
const fs = require('node:fs')
const vm = require('node:vm')
const ts = require('typescript')
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/models/services/couriers/expressfly.service.ts'), 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText
const exportsObject = {}
vm.runInNewContext(compiled, { exports: exportsObject, process: { env: {} }, console,
  require: (name) => name.includes('classes') ? { HttpError: Error } : {},
})
const pickup = { warehouse_name: 'Secondary', name: 'Seller', phone: '9999999999', address: '2 Market Road', city: 'Surat', state: 'Gujarat', pincode: '395007' }
const secondary = { _id: 'aaaaaaaaaaaaaaaaaaaaaaaa', warehouse_name: pickup.warehouse_name, address_line1: pickup.address, city: pickup.city, state: pickup.state, pincode: pickup.pincode, is_active: true }
const primary = { ...secondary, _id: 'bbbbbbbbbbbbbbbbbbbbbbbb', warehouse_name: 'Primary', address_line1: '1 Market Road' }
;(async () => {
  const service = new exportsObject.ExpressflyService()
  service.log = () => {}
  assert.equal(service.selectWarehouseForPickup([primary, secondary], pickup)._id, secondary._id)
  assert.equal(service.selectWarehouseForPickup([primary], pickup), null)
  assert.equal(service.selectWarehouseForPickup([{ ...secondary, is_active: false }], pickup), null)
  assert.throws(() => service.selectWarehouseForPickup([secondary, { ...secondary, _id: primary._id }], pickup))
  service.pickupAddressId = primary._id
  service.getWarehouseList = async ({ page }) => ({ data: page === 1 ? [primary] : [secondary], totalPages: 2 })
  assert.equal(await service.resolvePickupAddressId('local-uuid', pickup), secondary._id)
  await assert.rejects(service.resolvePickupAddressId(primary._id, pickup))
  let created = false
  service.getWarehouseList = async () => ({ data: created ? [primary, secondary] : [primary], totalPages: 1 })
  service.createWarehouse = async (payload) => { assert.equal(payload.address_line1, pickup.address); created = true }
  assert.equal(await service.resolvePickupAddressId('local-uuid', pickup), secondary._id)
  created = false
  service.createWarehouse = async () => {}
  await assert.rejects(service.resolvePickupAddressId('local-uuid', pickup))
  await assert.rejects(service.resolvePickupAddressId('local-uuid', { ...pickup, address: '' }))
  console.log('PASS: same-pincode selection, no fallback, inactive/duplicate rejection, pagination, global-ID override prevention, registration, unresolved pickup rejection')
})().catch((error) => { console.error(error); process.exitCode = 1 })
