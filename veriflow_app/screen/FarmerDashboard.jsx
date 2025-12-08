import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, SafeAreaView } from "react-native";
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from "@react-native-async-storage/async-storage";


export default function FarmerDashboard({ navigation }) {

  const goToMyPlots = async () => {
  try {
    const token = await AsyncStorage.getItem("token");
    navigation.navigate("MyPlots", { token });
  } catch (err) {
    console.error("Failed to get token", err);
    alert("Unable to open plots. Please try again.");
  }
};
  
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
        >
          <View style={styles.header}>
            <Text style={styles.title}>Farmer Dashboard</Text>
            <Text style={styles.subtitle}>Blue Carbon MRV • Field Operator</Text>
          </View>

          {/* SECTION: Quick Actions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("PlotRegistration")}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Add New Plot</Text>
              <Text style={styles.cardDesc}>Create a new mangrove plot entry.</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("RecordFieldData")}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Record Field Data</Text>
              <Text style={styles.cardDesc}>
                Add tree measurements, biomass, soil samples etc.
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("GeoCapture")}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Upload Geo-Tagged Photos</Text>
              <Text style={styles.cardDesc}>
                Capture images with GPS for verification.
              </Text>
            </TouchableOpacity>
          </View>

          {/* SECTION: Reports */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reports & Marketplace</Text>

            <TouchableOpacity
             style={styles.card}
             onPress={goToMyPlots}   // just pass the function reference
             activeOpacity={0.8}>
              <Text style={styles.cardTitle}>My Plots</Text>
              <Text style={styles.cardDesc}>View all registered plots.</Text>
              </TouchableOpacity>

            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("Marketplace")}
              activeOpacity={0.8}
            >
              <Text style={styles.cardTitle}>Marketplace</Text>
              <Text style={styles.cardDesc}>
                Browse and purchase carbon credit NFTs.
              </Text>
            </TouchableOpacity>
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
  title: {
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
  cardTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#5A7FE2',
    marginBottom: 6,
  },
  cardDesc: {
    fontSize: 15,
    color: '#475569',
    lineHeight: 20,
  },
});
