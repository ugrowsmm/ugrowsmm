import ServiceCatalog from '../components/ServiceCatalog'

/** New order = the same catalog as Services. Tapping a service opens the order sheet. */
export default function NewOrder() {
  return <ServiceCatalog variant="order" />
}
