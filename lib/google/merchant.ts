import { google, content_v2_1 } from "googleapis"

function getContentClient(accessToken: string) {
  const oauth2Client = new google.auth.OAuth2()
  oauth2Client.setCredentials({ access_token: accessToken })

  return google.content({ version: "v2.1", auth: oauth2Client })
}

export async function listMerchantAccounts(
  accessToken: string
): Promise<content_v2_1.Schema$Account[]> {
  const content = getContentClient(accessToken)

  // First try to get the authenticated user's accounts
  const { data } = await content.accounts.authinfo()

  const accounts: content_v2_1.Schema$Account[] = []

  if (data.accountIdentifiers) {
    for (const identifier of data.accountIdentifiers) {
      if (identifier.merchantId) {
        try {
          const { data: account } = await content.accounts.get({
            merchantId: identifier.merchantId,
            accountId: identifier.merchantId,
          })
          accounts.push(account)
        } catch {
          // Skip accounts we can't access
        }
      }
    }
  }

  return accounts
}

export async function getProducts(
  accessToken: string,
  merchantId: string,
  maxResults: number = 250
): Promise<content_v2_1.Schema$Product[]> {
  const content = getContentClient(accessToken)

  const products: content_v2_1.Schema$Product[] = []
  let pageToken: string | undefined

  do {
    const response = await content.products.list({
      merchantId,
      pageToken,
      maxResults,
    })

    if (response.data.resources) {
      products.push(...response.data.resources)
    }

    pageToken = response.data.nextPageToken || undefined
  } while (pageToken)

  return products
}

export async function getProduct(
  accessToken: string,
  merchantId: string,
  productId: string
): Promise<content_v2_1.Schema$Product> {
  const content = getContentClient(accessToken)

  const { data } = await content.products.get({
    merchantId,
    productId,
  })

  return data
}

export async function updateProductTitle(
  accessToken: string,
  merchantId: string,
  productId: string,
  newTitle: string
): Promise<content_v2_1.Schema$Product> {
  const content = getContentClient(accessToken)

  // Get current product first
  const currentProduct = await getProduct(accessToken, merchantId, productId)

  // Update with new title
  const { data } = await content.products.insert({
    merchantId,
    requestBody: {
      ...currentProduct,
      title: newTitle,
    },
  })

  return data
}

export async function getAccountInfo(
  accessToken: string,
  merchantId: string
): Promise<content_v2_1.Schema$Account> {
  const content = getContentClient(accessToken)

  const { data } = await content.accounts.get({
    merchantId,
    accountId: merchantId,
  })

  return data
}
