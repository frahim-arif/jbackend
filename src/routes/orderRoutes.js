import { Router } from 'express'

export function createOrderRouter(controller) {
  const router = Router()

  router.post('/create-order', controller.createOrder)
  router.get('/check-status', controller.checkStatus)
  router.get('/order/:merchantOrderId', controller.getOrder)
  router.get('/orders', controller.listOrders)
  router.post('/webhook/phonepe', controller.phonepeWebhook)

  return router
}
