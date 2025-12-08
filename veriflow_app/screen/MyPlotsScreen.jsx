import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  ActivityIndicator,
  Alert,
  RefreshControl,
  SafeAreaView,
  ScrollView
} from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import projectsService from "../services/projectsService";
import AsyncStorage from "@react-native-async-storage/async-storage";

export default function MyPlots() {
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchPlots = useCallback(async () => {
    try {
      setLoading(true);
      const token = await AsyncStorage.getItem("token");
      const userString = await AsyncStorage.getItem("user");

      if (!userString) throw new Error("User not found in storage. Please login again.");

      let user;
      try {
        user = JSON.parse(userString);
      } catch (e) {
        throw new Error("Stored user corrupted. Please login again.");
      }

      const userId = user._id || user.id;
      if (!userId) throw new Error("User ID missing. Please login again.");

      const data = await projectsService.getProjects(token, userId);
      setPlots(data);
    } catch (err) {
      console.error("Error fetching plots:", err);
      const msg = err?.response?.data?.message ?? err.message ?? "Failed to fetch plots";
      Alert.alert("Error", msg);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchPlots();
  }, [fetchPlots]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchPlots();
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Text style={styles.title}>{item.title}</Text>
      <Text style={styles.desc}>Area: {item.areaHectares} hectares</Text>
      <Text style={styles.desc}>Crop Type: {item.cropType}</Text>
      <Text style={styles.desc}>Start: {item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</Text>
      {item.description ? <Text style={styles.desc}>Remarks: {item.description}</Text> : null}
    </View>
  );

  if (loading && !refreshing) {
    return (
      <LinearGradient
        colors={['#4A90E2', '#7B68EE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.center}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading plots...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!loading && plots.length === 0) {
    return (
      <LinearGradient
        colors={['#4A90E2', '#7B68EE']}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <SafeAreaView style={styles.container}>
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Plots</Text>
            <Text style={styles.subtitle}>All registered blue carbon plots</Text>
          </View>
          <View style={styles.center}>
            <Text style={styles.emptyText}>No plots registered yet.</Text>
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
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#FFFFFF"
              colors={['#FFFFFF']}
            />
          }
        >
          <View style={styles.header}>
            <Text style={styles.headerTitle}>My Plots</Text>
            <Text style={styles.subtitle}>All registered blue carbon plots</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>{plots.length} Plot{plots.length !== 1 ? 's' : ''} Registered</Text>
            {plots.map((item) => (
              <View key={item._id || item.id} style={styles.card}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>Area: {item.areaHectares} hectares</Text>
                <Text style={styles.desc}>Crop Type: {item.cropType}</Text>
                <Text style={styles.desc}>Start: {item.startDate ? new Date(item.startDate).toLocaleDateString() : '-'}</Text>
                {item.description ? <Text style={styles.desc}>Remarks: {item.description}</Text> : null}
              </View>
            ))}
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingVertical: 20,
  },
  header: {
    paddingHorizontal: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  section: {
    paddingHorizontal: 20,
    marginBottom: 25,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 12,
    opacity: 0.9,
  },
  emptyText: {
    fontSize: 16,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  card: {
    backgroundColor: '#FFFFFF',
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 6,
    color: '#5A7FE2',
  },
  desc: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 20,
    marginBottom: 2,
  },
});