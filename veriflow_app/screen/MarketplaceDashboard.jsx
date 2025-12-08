import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import NFTCard from '../components/NFTCard';

export default function MarketplaceDashboard({ navigation }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [nfts, setNfts] = useState([]);

  // Sample NFT data - Replace this with actual blockchain data
  const sampleNFTs = [
    {
      id: 1,
      name: 'Carbon Credit NFT #001',
      description: 'Verified carbon offset from forest restoration project in tropical regions',
      price: '0.5',
      currency: 'ETH',
      image: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=500',
      seller: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
    },
    {
      id: 2,
      name: 'Forest Carbon NFT #042',
      description: 'Premium carbon credit from old-growth forest conservation',
      price: '1.2',
      currency: 'ETH',
      image: 'https://images.unsplash.com/photo-1511497584788-876760111969?w=500',
      seller: '0x8ba1f109551bD432803012645Ac136ddd64DBA72',
    },
    {
      id: 3,
      name: 'Reforestation NFT #123',
      description: 'Tokenized carbon offset supporting native tree planting initiatives',
      price: '0.8',
      currency: 'ETH',
      image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500',
      seller: '0x3E5e9111Ae8eB78Fe1CC3bb8915d5D461F3Ef9A9',
    },
    {
      id: 4,
      name: 'Forest Ecosystem NFT #089',
      description: 'High-quality carbon credit from verified forest ecosystem restoration',
      price: '1.5',
      currency: 'ETH',
      image: 'https://images.unsplash.com/photo-1448375240586-882707db888b?w=500',
      seller: '0x2546BcD3c84621e976D8185a91A922aE77ECEc30',
    },
    {
      id: 5,
      name: 'Woodland Protection NFT #067',
      description: 'Carbon offset certificate from woodland protection and tree conservation',
      price: '0.6',
      currency: 'ETH',
      image: 'https://images.unsplash.com/photo-1542273917363-3b1817f69a2d?w=500',
      seller: '0x564286362092D8e7936f0549571a803B203aAceD',
    },
  ];

  useEffect(() => {
    // Load NFTs when component mounts
    setNfts(sampleNFTs);
  }, []);

  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Simulated wallet connection
      // In a real implementation, you would use WalletConnect here
      setTimeout(() => {
        const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
        setWalletAddress(mockAddress);
        setIsConnecting(false);
        Alert.alert(
          'Wallet Connected',
          `Connected to ${mockAddress.slice(0, 6)}...${mockAddress.slice(-4)}`,
          [{ text: 'OK' }]
        );
      }, 1500);
    } catch (error) {
      setIsConnecting(false);
      Alert.alert('Connection Failed', 'Failed to connect wallet. Please try again.');
      console.error('Wallet connection error:', error);
    }
  };

  const disconnectWallet = () => {
    Alert.alert(
      'Disconnect Wallet',
      'Are you sure you want to disconnect your wallet?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Disconnect',
          style: 'destructive',
          onPress: () => {
            setWalletAddress(null);
            Alert.alert('Disconnected', 'Wallet disconnected successfully');
          },
        },
      ]
    );
  };

  const handleNFTPress = (nft) => {
    if (!walletAddress) {
      Alert.alert(
        'Wallet Not Connected',
        'Please connect your wallet to purchase NFTs',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Purchase NFT',
      `Do you want to buy ${nft.name} for ${nft.price} ${nft.currency}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: () => {
            Alert.alert('Success', 'NFT purchase initiated! Transaction pending...');
          },
        },
      ]
    );
  };

  return (
    <LinearGradient
      colors={['#4A90E2', '#7B68EE']}
      style={styles.gradient}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>NFT Marketplace</Text>
            <Text style={styles.subtitle}>Carbon Credit Tokens</Text>
          </View>

          {/* Wallet Connection Button */}
          <TouchableOpacity
            style={[
              styles.walletButton,
              walletAddress && styles.walletButtonConnected,
            ]}
            onPress={walletAddress ? disconnectWallet : connectWallet}
            disabled={isConnecting}
          >
            {isConnecting ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <Text style={styles.walletButtonText}>
                {walletAddress
                  ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
                  : 'Connect Wallet'}
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* NFT Listing */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.nftGrid}>
            {nfts.length > 0 ? (
              nfts.map((nft) => (
                <NFTCard
                  key={nft.id}
                  nft={nft}
                  onPress={handleNFTPress}
                  isWalletConnected={!!walletAddress}
                />
              ))
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateText}>No NFTs available</Text>
              </View>
            )}
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  walletButton: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    minWidth: 120,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  walletButtonConnected: {
    backgroundColor: '#10B981',
  },
  walletButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5A7FE2',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  nftGrid: {
    marginTop: 10,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyStateText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.7,
  },
});
