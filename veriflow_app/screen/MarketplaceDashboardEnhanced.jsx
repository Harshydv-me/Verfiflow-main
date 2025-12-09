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
  RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import { API_BASE } from '../config/api';
import blockchainService from '../services/blockchainService';

/**
 * Enhanced Marketplace Dashboard
 * Shows approved sellers with their verified carbon credits from blockchain
 */
export default function MarketplaceDashboardEnhanced({ navigation }) {
  const [walletAddress, setWalletAddress] = useState(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [approvedSellers, setApprovedSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchApprovedSellers();
  }, []);

  /**
   * Fetch all approved sellers (verified projects with ML results)
   */
  const fetchApprovedSellers = async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem('userToken');

      if (!token) {
        Alert.alert('Authentication Required', 'Please log in to view the marketplace');
        return;
      }

      // Fetch all projects
      const response = await axios.get(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const projects = response.data.projects || [];

      // Filter for verified projects with ML results
      const verifiedProjects = projects.filter(
        (project) =>
          project.status === 'verified' &&
          project.mlAnalysisResults &&
          project.mlAnalysisResults.final_results
      );

      // Group by owner to create seller profiles
      const sellerMap = {};

      verifiedProjects.forEach((project) => {
        const ownerId = project.owner?._id || project.owner;
        const ownerName = project.owner?.name || 'Unknown Farmer';
        const ownerEmail = project.owner?.email || '';

        if (!sellerMap[ownerId]) {
          sellerMap[ownerId] = {
            id: ownerId,
            name: ownerName,
            email: ownerEmail,
            totalCarbonCredits: 0,
            totalCarbonKg: 0,
            totalCarbonTons: 0,
            projects: [],
            totalValue: 0,
          };
        }

        const carbonKg =
          project.mlAnalysisResults.final_results?.carbon_sequestration_kg || 0;
        const carbonTons = blockchainService.kgToTons(carbonKg);
        const price = blockchainService.calculateCarbonCreditPrice(carbonKg);

        sellerMap[ownerId].projects.push({
          ...project,
          carbonKg,
          carbonTons,
          price,
        });

        sellerMap[ownerId].totalCarbonCredits += 1;
        sellerMap[ownerId].totalCarbonKg += carbonKg;
        sellerMap[ownerId].totalCarbonTons += carbonTons;
        sellerMap[ownerId].totalValue += price;
      });

      // Convert to array and sort by total carbon
      const sellers = Object.values(sellerMap).sort(
        (a, b) => b.totalCarbonTons - a.totalCarbonTons
      );

      setApprovedSellers(sellers);
    } catch (error) {
      console.error('Error fetching approved sellers:', error);
      Alert.alert('Error', 'Failed to fetch marketplace data');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle refresh
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await fetchApprovedSellers();
    setRefreshing(false);
  };

  /**
   * Mock wallet connection
   */
  const connectWallet = async () => {
    setIsConnecting(true);
    try {
      // Simulated wallet connection
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

  /**
   * Disconnect wallet
   */
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

  /**
   * Handle seller card press
   */
  const handleSellerPress = (seller) => {
    navigation.navigate('SellerDetailsScreen', { seller });
  };

  /**
   * Handle project purchase
   */
  const handleProjectPurchase = (project, seller) => {
    if (!walletAddress) {
      Alert.alert(
        'Wallet Not Connected',
        'Please connect your wallet to purchase carbon credits',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Purchase Carbon Credit',
      `Project: ${project.title}\n` +
        `Carbon: ${project.carbonTons.toFixed(2)} tons CO2\n` +
        `Price: ${project.price.toFixed(4)} MATIC\n\n` +
        `Seller: ${seller.name}\n` +
        `Do you want to proceed?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Buy Now',
          onPress: () => {
            // TODO: Implement blockchain purchase transaction
            Alert.alert('Success', 'Purchase initiated! Transaction pending...');
          },
        },
      ]
    );
  };

  /**
   * Render seller card
   */
  const renderSellerCard = (seller) => {
    return (
      <TouchableOpacity
        key={seller.id}
        style={styles.sellerCard}
        onPress={() => handleSellerPress(seller)}
        activeOpacity={0.8}
      >
        <View style={styles.sellerHeader}>
          <View style={styles.sellerAvatar}>
            <Text style={styles.sellerInitial}>
              {seller.name.charAt(0).toUpperCase()}
            </Text>
          </View>
          <View style={styles.sellerInfo}>
            <Text style={styles.sellerName}>{seller.name}</Text>
            <Text style={styles.sellerEmail}>{seller.email}</Text>
          </View>
          <View style={styles.verifiedBadge}>
            <Text style={styles.verifiedText}>✓ VERIFIED</Text>
          </View>
        </View>

        <View style={styles.sellerStats}>
          <View style={styles.statItem}>
            <Text style={styles.statValue}>{seller.totalCarbonCredits}</Text>
            <Text style={styles.statLabel}>Credits</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {seller.totalCarbonTons.toFixed(2)}
            </Text>
            <Text style={styles.statLabel}>Tons CO₂</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statItem}>
            <Text style={styles.statValue}>
              {seller.totalValue.toFixed(3)}
            </Text>
            <Text style={styles.statLabel}>MATIC</Text>
          </View>
        </View>

        <View style={styles.projectsList}>
          <Text style={styles.projectsTitle}>Available Projects:</Text>
          {seller.projects.slice(0, 2).map((project, index) => (
            <View key={index} style={styles.projectItem}>
              <View style={styles.projectInfo}>
                <Text style={styles.projectName} numberOfLines={1}>
                  {project.title}
                </Text>
                <Text style={styles.projectDetails}>
                  {project.carbonTons.toFixed(2)} tons • {project.areaHectares} ha
                </Text>
              </View>
              <TouchableOpacity
                style={styles.buyButton}
                onPress={() => handleProjectPurchase(project, seller)}
              >
                <Text style={styles.buyButtonText}>
                  {project.price.toFixed(3)} MATIC
                </Text>
              </TouchableOpacity>
            </View>
          ))}
          {seller.projects.length > 2 && (
            <Text style={styles.moreProjects}>
              +{seller.projects.length - 2} more projects
            </Text>
          )}
        </View>
      </TouchableOpacity>
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
            <Text style={styles.title}>Carbon Credit Marketplace</Text>
            <Text style={styles.subtitle}>
              {approvedSellers.length} Verified Sellers
            </Text>
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

        {/* Marketplace Info */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🌿 About Carbon Credits</Text>
          <Text style={styles.infoText}>
            Each credit represents verified CO₂ sequestration from sustainable
            forestry projects. Fixed at ${blockchainService.CARBON_CREDIT_PRICING.pricePerTonUSD}/ton.
          </Text>
        </View>

        {/* Sellers List */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading marketplace...</Text>
          </View>
        ) : approvedSellers.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🌱</Text>
            <Text style={styles.emptyStateTitle}>No Credits Available</Text>
            <Text style={styles.emptyStateText}>
              Verified carbon credits will appear here once projects are approved
            </Text>
          </View>
        ) : (
          <ScrollView
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FFFFFF"
              />
            }
          >
            {approvedSellers.map(renderSellerCard)}
          </ScrollView>
        )}
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
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
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
    shadowOffset: { width: 0, height: 2 },
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
  infoCard: {
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: 12,
    padding: 16,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 13,
    color: '#64748b',
    lineHeight: 18,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  sellerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  sellerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  sellerAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#4A90E2',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sellerInitial: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sellerInfo: {
    flex: 1,
    marginLeft: 12,
  },
  sellerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 2,
  },
  sellerEmail: {
    fontSize: 12,
    color: '#64748b',
  },
  verifiedBadge: {
    backgroundColor: '#10B981',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  verifiedText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sellerStats: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: 12,
    padding: 12,
    marginBottom: 16,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 11,
    color: '#64748b',
  },
  statDivider: {
    width: 1,
    height: 30,
    backgroundColor: '#cbd5e1',
  },
  projectsList: {
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
    paddingTop: 12,
  },
  projectsTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    marginBottom: 8,
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1e293b',
    marginBottom: 2,
  },
  projectDetails: {
    fontSize: 12,
    color: '#64748b',
  },
  buyButton: {
    backgroundColor: '#4A90E2',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  buyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  moreProjects: {
    fontSize: 12,
    color: '#4A90E2',
    fontWeight: '600',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#FFFFFF',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyStateIcon: {
    fontSize: 60,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    textAlign: 'center',
    lineHeight: 20,
  },
});
