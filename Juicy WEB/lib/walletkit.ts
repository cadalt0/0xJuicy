import { Core } from '@walletconnect/core'
import { WalletKit } from '@reown/walletkit'

const core = new Core({
  projectId: '167323e11d383f7f87c04473435199c3'
})

const metadata = {
  name: 'test1',
  description: 'AppKit Example',
  url: 'https://reown.com/appkit', // origin must match your domain & subdomain
  icons: ['https://assets.reown.com/reown-profile-pic.png']
}

export const walletKitPromise = WalletKit.init({
  core,
  metadata
}) 