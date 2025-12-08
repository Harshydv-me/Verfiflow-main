import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import { API_BASE } from "../services/projectsService"; // make sure api.js exports API_BASE
import axios from "axios";

export default function ManagePlotsScreen({ route}) {
  const {token}=route.params;
  const [plots, setPlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const isWeb = Platform.OS === "web";

  useEffect(() => {
    if (token) fetchPlots();
  }, [token]);

  // Fetch all plots
  const fetchPlots = async () => {
    try {
      const res = await axios.get(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlots(res.data.projects ?? []);
    } catch (err) {
      console.error("Error fetching plots:", err);
      Alert.alert("Error", "Unable to load plots. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  // Approve plot
  const handleApprove = async (id) => {
    try {
      await axios.patch(
        `${API_BASE}/api/projects/${id}`,
        { status: "approved" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setPlots((prev) =>
        prev.map((p) => (p._id === id ? { ...p, status: "approved" } : p))
      );
      Alert.alert("Success", "Plot has been approved successfully.");
    } catch (err) {
      console.error("Error approving plot:", err);
      Alert.alert("Error", "Failed to approve plot. Please try again.");
    }
  };

  // Reject plot (delete)
  const handleReject = async (id) => {
    Alert.alert(
      "Reject Plot",
      "Are you sure you want to reject and delete this plot? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Reject",
          style: "destructive",
          onPress: async () => {
            try {
              await axios.delete(`${API_BASE}/api/projects/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
              });
              setPlots((prev) => prev.filter((p) => p._id !== id));
              Alert.alert("Success", "Plot has been rejected and removed.");
            } catch (err) {
              console.error("Error rejecting plot:", err);
              Alert.alert("Error", "Failed to reject plot. Please try again.");
            }
          },
        },
      ]
    );
  };

  const Container = ({ children }) =>
    isWeb ? (
      <View style={styles.webScrollContainer}>{children}</View>
    ) : (
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {children}
      </ScrollView>
    );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFFFFF" />
      </View>
    );
  }

  return (
    <LinearGradient
      colors={["#4A90E2", "#7B68EE"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <Container>
        <View style={styles.header}>
          <Text style={styles.title}>Manage Plots</Text>
        </View>

        {plots.length === 0 ? (
          <Text style={styles.noPlots}>No plots registered yet.</Text>
        ) : (
          plots.map((plot) => {
            const id = plot._id;
            const name = plot.title || plot.name || "Unnamed Plot";

            // ✅ Fix: owner might be an object
            const ownerName =
              plot.owner?.name || plot.ownerName || "Unknown";

            const status = plot.status || "pending";

            return (
              <View key={id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Ionicons name="leaf" size={28} color="#5A7FE2" />
                </View>
                <Text style={styles.cardTitle}>{name}</Text>
                <Text style={styles.cardDesc}>Owner: {ownerName}</Text>
                <Text
                  style={[
                    styles.status,
                    status === "approved"
                      ? styles.approved
                      : (status === "pending" || status === "draft")
                        ? styles.pending
                        : styles.pending,
                  ]}
                >
                  {status.toUpperCase()}
                </Text>

                {(status === "pending" || status === "draft") && (
                  <View style={styles.actionRow}>
                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={() => handleApprove(id)}
                    >
                      <Text style={styles.approveText}>Approve</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={() => handleReject(id)}
                    >
                      <Text style={styles.rejectText}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </Container>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1, minHeight: "100vh" },
  scrollContent: { paddingVertical: 20, paddingHorizontal: 20, paddingBottom: 60 },
  webScrollContainer: { height: "100vh", overflowY: "auto", paddingVertical: 20, paddingHorizontal: 20 },
  header: { alignItems: "center", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "bold", color: "#FFFFFF" },
  noPlots: { color: "#fff", textAlign: "center", marginTop: 50, fontSize: 18 },
  card: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  cardHeader: { marginBottom: 8 },
  cardTitle: { fontSize: 18, fontWeight: "700", color: "#5A7FE2", marginBottom: 6 },
  cardDesc: { fontSize: 15, color: "#475569", lineHeight: 20 },
  status: { fontWeight: "700", marginTop: 8, marginBottom: 8 },
  approved: { color: "green" },
  pending: { color: "orange" },
  actionRow: { flexDirection: "row", gap: 10, marginTop: 8 },
  approveButton: { backgroundColor: "#5A7FE2", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  approveText: { color: "#fff", fontWeight: "600" },
  rejectButton: { backgroundColor: "#dc2626", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8 },
  rejectText: { color: "#fff", fontWeight: "600" },
  loadingContainer: { flex: 1, justifyContent: "center", alignItems: "center", minHeight: "100vh", backgroundColor: "#4A90E2" },
});
