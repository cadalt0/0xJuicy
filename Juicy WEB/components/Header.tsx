// 'use client';

// import React from 'react';
// import { motion } from 'framer-motion';
// import { Droplet, Wallet } from 'lucide-react';

// interface HeaderProps {
//   isWalletConnected?: boolean;
//   walletAddress?: string;
//   onConnectWallet?: () => void;
//   onDisconnectWallet?: () => void; // Optional, if you want a disconnect button
// }

// export default function Header({ 
//   isWalletConnected = false, 
//   walletAddress = '', 
//   onConnectWallet,
//   onDisconnectWallet
// }: HeaderProps) {
//   return (
//     <motion.header 
//       initial={{ opacity: 0, y: -20 }}
//       animate={{ opacity: 1, y: 0 }}
//       transition={{ duration: 0.6 }}
//       className="w-full bg-gray-900/80 backdrop-blur-sm border-b border-gray-800 px-4 py-3"
//     >
//       <div className="max-w-7xl mx-auto flex items-center justify-between">
//         {/* Juicy Logo */}
//         <motion.div 
//           className="flex items-center space-x-2"
//           whileHover={{ scale: 1.05 }}
//           transition={{ type: "spring", stiffness: 300 }}
//         >
//           <motion.div
//             animate={{ 
//               rotate: [0, 10, -10, 0],
//               scale: [1, 1.1, 1]
//             }}
//             transition={{ 
//               duration: 2, 
//               repeat: Infinity, 
//               repeatDelay: 3 
//             }}
//             className="text-blue-400"
//           >
//             <Droplet className="w-6 h-6" />
//           </motion.div>
//           <span className="text-xl font-bold text-white">juicy</span>
//         </motion.div>

//         {/* Connect Wallet Button */}
//         <motion.div
//           initial={{ opacity: 0, x: 20 }}
//           animate={{ opacity: 1, x: 0 }}
//           transition={{ duration: 0.6, delay: 0.2 }}
//         >
//           {!isWalletConnected ? (
//             <motion.button
//               onClick={onConnectWallet}
//               className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
//               whileHover={{ scale: 1.05 }}
//               whileTap={{ scale: 0.95 }}
//             >
//               <Wallet className="w-4 h-4" />
//               <span>Connect Wallet</span>
//             </motion.button>
//           ) : (
//             <motion.div
//               initial={{ opacity: 0, scale: 0.8 }}
//               animate={{ opacity: 1, scale: 1 }}
//               className="bg-green-900/30 border border-green-500/30 rounded-lg px-4 py-2 flex items-center space-x-2"
//             >
//               <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
//               <span className="text-green-400 font-medium text-sm">
//                 {walletAddress.slice(0, 6)}...{walletAddress.slice(-4)}
//               </span>
//               {onDisconnectWallet && (
//                 <button
//                   onClick={onDisconnectWallet}
//                   className="ml-2 text-xs text-red-400 hover:underline"
//                 >
//                   Disconnect
//                 </button>
//               )}
//             </motion.div>
//           )}
//         </motion.div>
//       </div>
//     </motion.header>
//   );
// } 

