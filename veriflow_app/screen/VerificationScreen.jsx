import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  Dimensions,
  Platform,
  Image,
} from "react-native";
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from "expo-linear-gradient";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";
import { API_BASE } from "../services/projectsService";
import projectsService from "../services/projectsService";

const { width, height } = Dimensions.get("window");

export default function VerificationScreen({ route, navigation }) {
  const { token } = route.params || {};

  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [mlResults, setMlResults] = useState(null);
  const [notes, setNotes] = useState("");
  const [modalVisible, setModalVisible] = useState(false);
  const [resultsModalVisible, setResultsModalVisible] = useState(false);
  const [droneImage, setDroneImage] = useState(null);
  const [manualHeight, setManualHeight] = useState("6.23");
  const [showTargetImagePreview, setShowTargetImagePreview] = useState(false);
  const [analysisStage, setAnalysisStage] = useState("");

  useEffect(() => {
    if (token) {
      fetchProjects();
    }
  }, [token]);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/api/projects`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Filter projects that need ML verification (submitted or underReview projects without ML results)
      const pendingProjects = (res.data.projects || []).filter(
        (p) => (p.status === 'submitted' || p.status === 'underReview') && !p.mlAnalysisResults
      );

      setProjects(pendingProjects);
    } catch (err) {
      console.error("Error fetching projects:", err);
      Alert.alert("Error", "Failed to load projects");
    } finally {
      setLoading(false);
    }
  };

  const pickDroneImage = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow access to photos to upload drone images"
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 1,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        setDroneImage(result.assets[0]);
        setShowTargetImagePreview(true);
        Alert.alert("Success", "Target image selected! Review and proceed with analysis.");
      }
    } catch (error) {
      console.error("Error picking image:", error);
      Alert.alert("Error", "Failed to pick image");
    }
  };

  const runMLAnalysis = async () => {
    if (!selectedProject) {
      Alert.alert("Error", "Please select a project first");
      return;
    }

    if (!droneImage) {
      Alert.alert("Error", "Please select a drone image first");
      return;
    }

    try {
      setAnalyzing(true);
      setModalVisible(false);
      setShowTargetImagePreview(false);

      // Get ML API URL from service
      const mlApiUrl = await projectsService.getMLApiUrl();

      if (!mlApiUrl || mlApiUrl.includes("YOUR_NGROK_URL")) {
        Alert.alert(
          "Configuration Error",
          "ML API URL is not configured. Please update the Ngrok URL in projectsService.js"
        );
        setAnalyzing(false);
        return;
      }

      // Prepare FormData
      const formData = new FormData();

      // Add drone image (this is the TARGET IMAGE for verification)
      const imageUri = Platform.OS === "android"
        ? droneImage.uri
        : droneImage.uri.replace("file://", "");

      const filename = droneImage.uri.split("/").pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : "image/jpeg";

      formData.append("image", {
        uri: imageUri,
        name: filename,
        type: type,
      });

      // Add date range (use project dates or defaults)
      const startDate = "2024-01-01"
      const endDate = "2024-12-31"

      formData.append("start_date", startDate);
      formData.append("end_date", endDate);
      formData.append("manual_height", parseFloat(manualHeight) || 6.23);

      console.log("=".repeat(80));
      console.log("🎯 TARGET IMAGE FOR VERIFICATION:", filename);
      console.log("=".repeat(80));
      console.log("📍 Project:", selectedProject.title);
      console.log("📅 Date Range:", startDate, "to", endDate);
      console.log("📏 Manual Height:", manualHeight, "meters");
      console.log("\n🛰️  STEP 1: Running Satellite Model");
      console.log("Command: python 3mix.py --mode autopredict --start", startDate, "--end", endDate, "--points-csv points.csv");
      console.log("\n🚁 STEP 2: Sending target image to Drone Model for verification");
      console.log("Target Image:", filename);
      console.log("\n🔗 STEP 3: Integration of results");
      console.log("=".repeat(80));

      setAnalysisStage("Running Satellite Analysis...");

      // Send to ML API
      const response = await axios.post(mlApiUrl, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        timeout: 300000, // 5 minute timeout for ML processing
      });

      console.log("✅ ML Analysis Complete!");
      console.log("Response:", response.data);

      if (response.data.status === "success") {
        setMlResults(response.data);

        // Save ML results to project
        await axios.patch(
          `${API_BASE}/api/projects/${selectedProject._id}`,
          {
            mlAnalysisResults: {
              ...response.data,
              final_results: {
                agb_mg_ha: response.data.final_results?.agb_Mg_per_ha || 0,
                carbon_sequestration_kg: response.data.final_results?.carbon_sequestration_kg || 0,
                study_area_ha: response.data.final_results?.study_area_ha || 0,
              },
              component_results: {
                satellite: {
                  agb_mg_ha: response.data.component_results?.satellite?.agb_Mg_per_ha || 0,
                  height_m: response.data.component_results?.satellite?.height_m || 0,
                  confidence: response.data.component_results?.satellite?.confidence || 0,
                  n_points: response.data.component_results?.satellite?.n_points || 0,
                },
                drone: {
                  agb_mg_ha: response.data.component_results?.drone?.agb_Mg_per_ha || 0,
                  area_m2: response.data.component_results?.drone?.area_m2 || 0,
                  openness: response.data.component_results?.drone?.openness || 0,
                  carbon_kg: response.data.component_results?.drone?.carbon_kg || 0,
                  co2_kg: response.data.component_results?.drone?.co2_kg || 0,
                  confidence: response.data.component_results?.drone?.confidence || 0,
                },
              },
              job_id: response.data.job_id,
              processing_time_seconds: response.data.processing_time_seconds,
            },
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        setResultsModalVisible(true);
        Alert.alert(
          "Success",
          `ML Analysis Complete!\n\nCarbon Sequestration: ${response.data.final_results?.carbon_sequestration_kg?.toFixed(2)} kg`
        );
      } else {
        throw new Error("ML analysis failed");
      }
    } catch (error) {
      console.error("ML Analysis Error:", error);
      const errorMsg = error.response?.data?.detail || error.message || "ML analysis failed";
      Alert.alert(
        "Analysis Failed",
        `Failed to complete ML analysis:\n${errorMsg}\n\nPlease ensure:\n1. ML API server is running\n2. Ngrok URL is configured\n3. Drone image is valid`
      );
    } finally {
      setAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    if (!notes.trim()) {
      Alert.alert("Notes Required", "Please add approval notes");
      return;
    }

    if (!mlResults) {
      Alert.alert("Error", "Please run ML analysis first");
      return;
    }

    try {
      await axios.patch(
        `${API_BASE}/api/projects/${selectedProject._id}`,
        {
          status: "verified",
          verification: {
            verified: true,
            notes: notes,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Project approved successfully!");
      setResultsModalVisible(false);
      setSelectedProject(null);
      setMlResults(null);
      setNotes("");
      setDroneImage(null);
      fetchProjects();
    } catch (error) {
      console.error("Approval Error:", error);
      Alert.alert("Error", "Failed to approve project");
    }
  };

  const handleReject = async () => {
    if (!notes.trim()) {
      Alert.alert("Notes Required", "Please provide rejection reason");
      return;
    }

    try {
      await axios.patch(
        `${API_BASE}/api/projects/${selectedProject._id}`,
        {
          status: "rejected",
          verification: {
            verified: false,
            notes: notes,
          },
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      Alert.alert("Success", "Project rejected");
      setResultsModalVisible(false);
      setSelectedProject(null);
      setMlResults(null);
      setNotes("");
      setDroneImage(null);
      fetchProjects();
    } catch (error) {
      console.error("Rejection Error:", error);
      Alert.alert("Error", "Failed to reject project");
    }
  };

  const handleModalClose = () => {
    setModalVisible(false);
    setShowTargetImagePreview(false);
    setDroneImage(null);
    setManualHeight("6.23");
  };

  if (loading) {
    return (
      <LinearGradient colors={["#4A90E2", "#7B68EE"]} style={styles.gradient}>
        <SafeAreaView style={styles.container}>
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#FFFFFF" />
            <Text style={styles.loadingText}>Loading projects...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={["#4A90E2", "#7B68EE"]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.gradient}
    >
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
            <Text style={styles.title}>ML Verification</Text>
            <View style={styles.backButton} />
          </View>

          {analyzing && (
            <View style={styles.analyzingBanner}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.analyzingText}>
                {analysisStage || "Running ML Analysis... This may take 2-5 minutes"}
              </Text>
            </View>
          )}

          {projects.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Ionicons name="checkmark-circle" size={80} color="#FFFFFF" />
              <Text style={styles.emptyText}>
                No projects pending verification
              </Text>
              <Text style={styles.emptySubtext}>
                No submitted or under-review projects need ML analysis
              </Text>
            </View>
          ) : (
            <>
              <Text style={styles.sectionTitle}>
                Projects Pending ML Verification ({projects.length})
              </Text>

              {projects.map((project) => (
                <View key={project._id} style={styles.projectCard}>
                  <View style={styles.projectHeader}>
                    <Ionicons name="leaf" size={24} color="#5A7FE2" />
                    <Text style={styles.projectTitle}>{project.title}</Text>
                  </View>

                  <View style={styles.projectDetails}>
                    <Text style={styles.projectDetail}>
                      Area: {project.areaHectares} hectares
                    </Text>
                    <Text style={styles.projectDetail}>
                      Owner: {project.owner?.name || "Unknown"}
                    </Text>
                    {project.location?.city && (
                      <Text style={styles.projectDetail}>
                        Location: {project.location.city}, {project.location.state}
                      </Text>
                    )}
                  </View>

                  <TouchableOpacity
                    style={styles.selectButton}
                    onPress={() => {
                      setSelectedProject(project);
                      setModalVisible(true);
                    }}
                  >
                    <Ionicons name="analytics" size={20} color="#FFFFFF" />
                    <Text style={styles.selectButtonText}>Run ML Analysis</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}
        </ScrollView>
      </SafeAreaView>

      {/* ML Analysis Setup Modal */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={handleModalClose}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Setup ML Analysis</Text>
              <TouchableOpacity onPress={handleModalClose}>
                <Ionicons name="close" size={28} color="#475569" />
              </TouchableOpacity>
            </View>

            <Text style={styles.modalSubtitle}>{selectedProject?.title}</Text>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Target Image for Verification:</Text>
              <TouchableOpacity style={styles.uploadButton} onPress={pickDroneImage}>
                <Ionicons name="cloud-upload-outline" size={24} color="#FFFFFF" />
                <Text style={styles.uploadButtonText}>
                  {droneImage ? "Change Image" : "Select Target Image"}
                </Text>
              </TouchableOpacity>
              {droneImage && showTargetImagePreview && (
                <View style={styles.imagePreviewContainer}>
                  <Text style={styles.imagePreviewLabel}>Selected Target Image:</Text>
                  <Image
                    source={{ uri: droneImage.uri }}
                    style={styles.targetImagePreview}
                    resizeMode="cover"
                  />
                  <Text style={styles.imageInfo}>
                    {droneImage.uri.split("/").pop()}
                  </Text>
                  <View style={styles.verificationStepsContainer}>
                    <Text style={styles.verificationStepsTitle}>Analysis Steps:</Text>
                    <Text style={styles.verificationStep}>
                      🛰️  1. Satellite Model: --mode autopredict --start [date] --end [date] --points-csv points.csv
                    </Text>
                    <Text style={styles.verificationStep}>
                      🚁 2. Drone Verification: Process target image
                    </Text>
                    <Text style={styles.verificationStep}>
                      🔗 3. Integration: Combine results
                    </Text>
                  </View>
                </View>
              )}
              {droneImage && !showTargetImagePreview && (
                <Text style={styles.imageInfo}>
                  {droneImage.uri.split("/").pop()}
                </Text>
              )}
            </View>

            <View style={styles.inputSection}>
              <Text style={styles.inputLabel}>Manual Tree Height (meters):</Text>
              <TextInput
                style={styles.input}
                value={manualHeight}
                onChangeText={setManualHeight}
                keyboardType="decimal-pad"
                placeholder="6.23"
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={handleModalClose}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.analyzeButton, !droneImage && styles.disabledButton]}
                onPress={runMLAnalysis}
                disabled={!droneImage}
              >
                <Ionicons name="flash" size={20} color="#FFFFFF" />
                <Text style={styles.analyzeButtonText}>
                  {showTargetImagePreview ? "Proceed with Analysis" : "Run Analysis"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* ML Results Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={resultsModalVisible}
        onRequestClose={() => setResultsModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.resultsModalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsTitle}>ML Analysis Results</Text>
                <TouchableOpacity onPress={() => setResultsModalVisible(false)}>
                  <Ionicons name="close" size={28} color="#475569" />
                </TouchableOpacity>
              </View>

              {mlResults && (
                <>
                  <View style={styles.resultCard}>
                    <Text style={styles.resultCardTitle}>
                      Carbon Sequestration
                    </Text>
                    <Text style={styles.resultCardValue}>
                      {mlResults.final_results?.carbon_sequestration_kg?.toFixed(2)} kg
                    </Text>
                  </View>

                  <View style={styles.resultCard}>
                    <Text style={styles.resultCardTitle}>Biomass (AGB)</Text>
                    <Text style={styles.resultCardValue}>
                      {mlResults.final_results?.agb_Mg_per_ha?.toFixed(2)} Mg/ha
                    </Text>
                  </View>

                  <View style={styles.resultRow}>
                    <View style={[styles.resultCard, styles.halfCard]}>
                      <Text style={styles.smallCardTitle}>Satellite</Text>
                      <Text style={styles.smallCardValue}>
                        {mlResults.component_results?.satellite?.agb_Mg_per_ha?.toFixed(1)} Mg/ha
                      </Text>
                    </View>

                    <View style={[styles.resultCard, styles.halfCard]}>
                      <Text style={styles.smallCardTitle}>Drone</Text>
                      <Text style={styles.smallCardValue}>
                        {mlResults.component_results?.drone?.agb_Mg_per_ha?.toFixed(1)} Mg/ha
                      </Text>
                    </View>
                  </View>

                  <View style={styles.metadataCard}>
                    <Text style={styles.metadataText}>
                      Job ID: {mlResults.job_id}
                    </Text>
                    <Text style={styles.metadataText}>
                      Processing Time: {mlResults.processing_time_seconds}s
                    </Text>
                  </View>

                  <View style={styles.notesSection}>
                    <Text style={styles.notesLabel}>Verification Notes:</Text>
                    <TextInput
                      style={styles.notesInput}
                      placeholder="Add notes about the verification..."
                      placeholderTextColor="#94a3b8"
                      value={notes}
                      onChangeText={setNotes}
                      multiline
                      numberOfLines={4}
                    />
                  </View>

                  <View style={styles.approvalActions}>
                    <TouchableOpacity
                      style={styles.rejectButton}
                      onPress={handleReject}
                    >
                      <Ionicons name="close-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.rejectButtonText}>Reject</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={styles.approveButton}
                      onPress={handleApprove}
                    >
                      <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
                      <Text style={styles.approveButtonText}>Approve</Text>
                    </TouchableOpacity>
                  </View>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: {
    paddingVertical: 20,
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#FFFFFF",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: "#FFFFFF",
    fontWeight: "600",
  },
  analyzingBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(255,255,255,0.2)",
    padding: 15,
    borderRadius: 10,
    marginBottom: 20,
  },
  analyzingText: {
    marginLeft: 10,
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
  },
  emptyContainer: {
    alignItems: "center",
    marginTop: 100,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
    marginTop: 20,
  },
  emptySubtext: {
    color: "#FFFFFF",
    fontSize: 14,
    marginTop: 10,
    opacity: 0.8,
    textAlign: "center",
    paddingHorizontal: 40,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 15,
  },
  projectCard: {
    backgroundColor: "#FFFFFF",
    padding: 18,
    borderRadius: 12,
    marginBottom: 15,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
  },
  projectHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  projectTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1e293b",
    marginLeft: 10,
    flex: 1,
  },
  projectDetails: {
    marginBottom: 12,
  },
  projectDetail: {
    fontSize: 14,
    color: "#475569",
    marginBottom: 4,
  },
  selectButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    borderRadius: 8,
  },
  selectButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: width * 0.9,
    padding: 25,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 15,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#1e293b",
  },
  modalSubtitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 20,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
  },
  uploadButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#4A90E2",
    paddingVertical: 12,
    borderRadius: 8,
  },
  uploadButtonText: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 8,
  },
  imageInfo: {
    fontSize: 12,
    color: "#64748b",
    marginTop: 8,
  },
  modalActions: {
    flexDirection: "row",
    gap: 10,
    marginTop: 20,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    alignItems: "center",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#64748b",
  },
  analyzeButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 15,
    borderRadius: 12,
  },
  disabledButton: {
    backgroundColor: "#94a3b8",
  },
  analyzeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  resultsModalContent: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    width: width * 0.9,
    maxHeight: height * 0.85,
    padding: 25,
  },
  resultsHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  resultsTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#1e293b",
  },
  resultCard: {
    backgroundColor: "#f8fafc",
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  resultCardTitle: {
    fontSize: 16,
    color: "#64748b",
    marginBottom: 8,
  },
  resultCardValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#10b981",
  },
  resultRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  halfCard: {
    width: "48%",
  },
  smallCardTitle: {
    fontSize: 14,
    color: "#64748b",
    marginBottom: 5,
  },
  smallCardValue: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#4A90E2",
  },
  metadataCard: {
    backgroundColor: "#e0f2fe",
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
  },
  metadataText: {
    fontSize: 13,
    color: "#475569",
    marginBottom: 5,
  },
  notesSection: {
    marginBottom: 20,
  },
  notesLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 10,
  },
  notesInput: {
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: "#1e293b",
    minHeight: 100,
    textAlignVertical: "top",
  },
  approvalActions: {
    flexDirection: "row",
    gap: 10,
  },
  rejectButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#ef4444",
    paddingVertical: 15,
    borderRadius: 12,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  approveButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#10b981",
    paddingVertical: 15,
    borderRadius: 12,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
    marginLeft: 8,
  },
  imagePreviewContainer: {
    marginTop: 15,
    padding: 15,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  imagePreviewLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1e293b",
    marginBottom: 10,
  },
  targetImagePreview: {
    width: "100%",
    height: 200,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: "#e2e8f0",
  },
  verificationStepsContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: "#e0f2fe",
    borderRadius: 8,
  },
  verificationStepsTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1e293b",
    marginBottom: 8,
  },
  verificationStep: {
    fontSize: 11,
    color: "#475569",
    marginBottom: 5,
    lineHeight: 16,
  },
});
