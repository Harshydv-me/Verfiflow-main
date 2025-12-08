import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  TextInput,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import API from "../services/projectsService";

export default function MarketplaceUsersScreen({ navigation, route }) {
  const [token, setToken] = useState(route.params?.token || null);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  // Get token from AsyncStorage if not provided in route params
  useEffect(() => {
    const getToken = async () => {
      if (!token) {
        const savedToken = await AsyncStorage.getItem("token");
        setToken(savedToken);
      }
    };
    getToken();
  }, []);

  // Fetch all marketplace users from backend
  const fetchMarketplaceUsers = async () => {
    if (!token) {
      setError({
        message: "Authentication token not found",
        isNetworkError: false
      });
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await API.getAllMarketplaceUsers(token);
      setUsers(data);
      setRetryCount(0); // Reset retry count on success
    } catch (err) {
      console.log("Error fetching marketplace users:", err.response?.data || err.message);
      setError({
        message: err.response?.data?.message || err.message || "Unable to load marketplace users",
        isNetworkError: !err.response || err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND'
      });
    } finally {
      setLoading(false);
    }
  };

  // Fetch users when token is available
  useEffect(() => {
    if (token) {
      fetchMarketplaceUsers();
    }
  }, [token]);

  // Retry loading data
  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    fetchMarketplaceUsers();
  };

  // Filter users by search query
  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    return (
      user.name?.toLowerCase().includes(searchLower) ||
      user.email?.toLowerCase().includes(searchLower) ||
      user.phone?.toLowerCase().includes(searchLower)
    );
  });

  // Loading state
  if (loading && users.length === 0) {
    return (
      <LinearGradient
        colors={['#4A90E2', '#7B68EE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading marketplace users...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  // Error state with retry
  if (error && users.length === 0) {
    return (
      <LinearGradient
        colors={['#4A90E2', '#7B68EE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <View style={styles.headerTextContainer}>
              <Text style={styles.title}>Marketplace Users</Text>
            </View>
          </View>

          <View style={styles.errorContainer}>
            <Ionicons
              name={error.isNetworkError ? "cloud-offline-outline" : "alert-circle-outline"}
              size={80}
              color="#FFFFFF"
            />
            <Text style={styles.errorTitle}>
              {error.isNetworkError ? "Connection Error" : "Error Loading Data"}
            </Text>
            <Text style={styles.errorMessage}>{error.message}</Text>
            <Text style={styles.errorSubtext}>
              {error.isNetworkError
                ? "Please check your internet connection and try again"
                : "Something went wrong. Please try again"}
            </Text>

            <TouchableOpacity
              style={styles.retryButton}
              onPress={handleRetry}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <>
                  <Ionicons name="refresh" size={20} color="#FFFFFF" />
                  <Text style={styles.retryButtonText}>
                    {retryCount > 0 ? `Retry (${retryCount})` : "Try Again"}
                  </Text>
                </>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.secondaryButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.secondaryButtonText}>Go Back</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

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
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerTextContainer}>
            <Text style={styles.title}>Marketplace Users</Text>
            <Text style={styles.subtitle}>{users.length} Total Users</Text>
          </View>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={handleRetry}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Ionicons name="refresh" size={24} color="#FFFFFF" />
            )}
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <Ionicons name="search" size={20} color="#64748b" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by name, email, or phone..."
            placeholderTextColor="#94a3b8"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={20} color="#64748b" />
            </TouchableOpacity>
          )}
        </View>

        {/* User List */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredUsers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="people-outline" size={64} color="#cbd5e1" />
              <Text style={styles.emptyText}>
                {searchQuery ? "No users found" : "No marketplace users yet"}
              </Text>
              <Text style={styles.emptySubtext}>
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Marketplace users will appear here once they register"}
              </Text>
            </View>
          ) : (
            filteredUsers.map(user => (
              <View key={user._id} style={styles.userCard}>
                <View style={styles.userHeader}>
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={24} color="#5A7FE2" />
                  </View>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{user.name || "No name"}</Text>
                    <Text style={styles.userEmail}>{user.email}</Text>
                    {user.phone && <Text style={styles.userPhone}>{user.phone}</Text>}
                  </View>
                  <View style={styles.roleBadge}>
                    <Ionicons name="storefront" size={14} color="#10b981" />
                    <Text style={styles.roleText}>Marketplace</Text>
                  </View>
                </View>

                <View style={styles.userDetails}>
                  <View style={styles.detailItem}>
                    <Ionicons name="calendar-outline" size={16} color="#64748b" />
                    <Text style={styles.detailText}>
                      Joined {new Date(user.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

// ====== Styles ======
const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
    padding: 5,
  },
  refreshButton: {
    padding: 5,
    marginLeft: 10,
  },
  headerTextContainer: {
    flex: 1,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 12,
    paddingHorizontal: 15,
    height: 48,
    elevation: 3,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1e293b',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginTop: 15,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.8,
    marginTop: 5,
    textAlign: 'center',
  },
  userCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 8,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  userAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E0E7FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 2,
  },
  userPhone: {
    fontSize: 14,
    color: '#64748b',
  },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: '#10b98120',
    gap: 4,
  },
  roleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#10b981',
  },
  userDetails: {
    flexDirection: 'row',
    marginBottom: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: '#64748b',
  },
  errorContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginTop: 20,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 10,
    textAlign: 'center',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.7,
    marginTop: 8,
    textAlign: 'center',
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    marginTop: 30,
    gap: 8,
    minWidth: 160,
  },
  retryButtonText: {
    color: '#5A7FE2',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginTop: 15,
  },
  secondaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    opacity: 0.9,
  },
});
