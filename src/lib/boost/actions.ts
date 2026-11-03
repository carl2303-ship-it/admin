// Barrel — sem "use server" aqui (Next só permite export de async fns em ficheiros "use server").
// Cada módulo actions-*.ts tem "use server".

export type { ActionResult } from './actions-shared'

export {
  uploadBoostImage,
  saveProduct,
  quickUpdateProduct,
  reorderProducts,
  deleteProduct,
  duplicateProduct,
  updateOrderStatus,
  deleteOrder,
  saveCategory,
  deleteCategory,
  saveBrand,
  deleteBrand,
  saveDiscount,
  getDigitalProductsForEmailPreview,
  deleteDiscount,
} from './actions-commerce'

export {
  saveSaasLicense,
  toggleSaasStatus,
  updateSaasPlan,
  deleteSaasLicense,
  resendSaasCredentials,
  generateSaasPaymentLink,
  sendSaasPaymentLinkEmail,
  saveBlogPost,
  deleteBlogPost,
  deleteEbookPurchase,
} from './actions-saas'

export {
  createEbookFunnel,
  updateEbookFunnel,
  setEbookFunnelStatus,
  uploadEbookFunnelAsset,
  deleteEbookFunnelAsset,
  generateEbookFunnelLanding,
} from './actions-funnels'

export {
  importLegacyPadelIqFunnel,
  publishEbookFunnelToStore,
} from './actions-funnel-store'
