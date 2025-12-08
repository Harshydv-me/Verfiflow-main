import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { CameraView, useCameraPermissions } from "expo-camera";
import * as Location from "expo-location";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import projectsService from "../services/projectsService";

export default function GeoCaptureScreen() {
  const cameraRef = useRef(null);
  const [permission, requestPermission] = useCameraPermissions();

  const [images, setImages] = useState([]);
  const [projectId, setProjectId] = useState("");
  const [loading, setLoading] = useState(false);
  const [cameraOpen, setCameraOpen] = useState(false);

  // Ask Location Permission
  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission denied", "Location access is required.");
      }
    })();
  }, []);

  // Capture Image
  const captureImage = async () => {
    if (!cameraRef.current) return;

    try {
      setLoading(true);

      const pic = await cameraRef.current.takePictureAsync({
        quality: 0.7,
        base64: true,
      });

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Highest,
      });

      const meta = {
        uri: pic.uri,
        base64: pic.base64,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: new Date().toLocaleString(),
      };

      if (images.length < 4) {
        setImages([...images, meta]);
      } else {
        Alert.alert("Limit Reached", "You can upload only 4 images.");
      }

      setCameraOpen(false);
    } catch (err) {
      Alert.alert("Error", err.message);
    } finally {
      setLoading(false);
    }
  };

  // Pick Image From Gallery
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        base64: true,
        quality: 0.7,
      });

      if (!result.canceled) {
        const meta = {
          uri: result.assets[0].uri,
          base64: result.assets[0].base64,
          latitude: null,
          longitude: null,
          timestamp: new Date().toLocaleString(),
        };

        if (images.length < 4) {
          setImages([...images, meta]);
        } else {
          Alert.alert("Limit Reached", "You can upload only 4 images.");
        }
      }
    } catch (error) {
      Alert.alert("Error", error.message);
    }
  };

  // Remove Image
  const removeImage = (index) => {
    let arr = [...images];
    arr.splice(index, 1);
    setImages(arr);
  };

  // Upload image + metadata
  // Upload image + metadata
const uploadImages = async () => {
  if (!projectId)
    return Alert.alert("Missing Project ID", "Please enter a project ID.");
  if (images.length === 0)
    return Alert.alert("No Images", "Please upload or capture images first.");

  setLoading(true);

  try {
    const token = await AsyncStorage.getItem("token");

    for (let i = 0; i < images.length; i++) {
      const img = images[i];

      await projectsService.uploadImage(
        projectId,
        token,
        {
          uri: img.uri,
          name: `photo_${Date.now()}_${i}.jpg`,
          type: "image/jpeg",
        },
        {
          latitude: img.latitude,
          longitude: img.longitude,
          timestamp: img.timestamp,
        }
      );
    }

    Alert.alert("Success", "All images uploaded with geotag metadata.");
    setImages([]);

  } catch (err) {
    console.error("Upload error:", err.response || err);
    const msg =
      err?.response?.data?.message || err.message || "Upload failed";
    Alert.alert("Upload failed", msg);

  } finally {
    setLoading(false);
  }
};


  if (!permission) return <View />;
  if (!permission.granted)
    return (
      <View style={styles.center}>
        <Text>Camera permission is required</Text>
        <TouchableOpacity onPress={requestPermission} style={styles.button}>
          <Text style={styles.buttonText}>Grant Permission</Text>
        </TouchableOpacity>
      </View>
    );

  return (
    <View style={styles.container}>
      {/* CAMERA SECTION */}
      {cameraOpen ? (
        <View style={{ flex: 1 }}>
          <CameraView ref={cameraRef} style={styles.cameraView} />

          <TouchableOpacity style={styles.captureBtn} onPress={captureImage}>
            {loading ? (
              <ActivityIndicator color="#fff" size="large" />
            ) : (
              <Text style={styles.captureText}>Capture</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.closeBtn}
            onPress={() => setCameraOpen(false)}
          >
            <Text style={styles.closeText}>Close</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView contentContainerStyle={{ padding: 16 }}>
          <Text style={styles.header}>Upload or Capture Images (Max 4)</Text>

          {/* Buttons */}
          <View style={styles.btnRow}>
            <TouchableOpacity
              style={styles.camBtn}
              onPress={() => {
                if (images.length < 4) setCameraOpen(true);
                else Alert.alert("Limit reached", "Max 4 images allowed");
              }}
            >
              <Text style={styles.btnText}>Capture</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.galleryBtn} onPress={pickImage}>
              <Text style={styles.btnText}>Gallery</Text>
            </TouchableOpacity>
          </View>

          {/* Project ID */}
          <TextInput
            style={styles.input}
            placeholder="Enter Project ID"
            placeholderTextColor="#555"
            value={projectId}
            onChangeText={setProjectId}
          />

          {/* Upload button */}
          <TouchableOpacity style={styles.uploadAllBtn} onPress={uploadImages}>
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <Text style={styles.uploadText}>Attach Images to Project</Text>
            )}
          </TouchableOpacity>

          {/* Image Grid */}
          <View style={styles.grid}>
            {images.map((img, index) => (
              <View key={index} style={styles.card}>
                <Image source={{ uri: img.uri }} style={styles.imgPreview} />

                <TouchableOpacity
                  style={styles.deleteBtn}
                  onPress={() => removeImage(index)}
                >
                  <Text style={styles.deleteText}>X</Text>
                </TouchableOpacity>

                <Text style={styles.metaText}>
                  📍 {img.latitude ?? "N/A"}, {img.longitude ?? "N/A"}
                </Text>
                <Text style={styles.metaText}>🕒 {img.timestamp}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },

  header: {
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 20,
    textAlign: "center",
  },

  camBtn: {
    backgroundColor: "#2563EB",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },
  galleryBtn: {
    backgroundColor: "#10B981",
    padding: 14,
    borderRadius: 12,
    width: "48%",
    alignItems: "center",
  },

  uploadAllBtn: {
    backgroundColor: "#1E293B",
    padding: 14,
    borderRadius: 12,
    alignItems: "center",
    marginVertical: 16,
  },
  uploadText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  btnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  btnRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },

  input: {
    backgroundColor: "#fff",
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    marginBottom: 10,
  },

  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },

  card: {
    width: "48%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    elevation: 3,
  },

  imgPreview: {
    width: "100%",
    height: 140,
    borderRadius: 10,
    marginBottom: 6,
  },

  deleteBtn: {
    position: "absolute",
    right: 8,
    top: 8,
    backgroundColor: "#DC2626",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  deleteText: { color: "#fff", fontWeight: "700" },

  metaText: {
    fontSize: 12,
    color: "#334155",
    marginBottom: 2,
  },

  cameraView: { flex: 1 },

  captureBtn: {
    position: "absolute",
    bottom: 30,
    width: "60%",
    left: "20%",
    backgroundColor: "#2563EB",
    padding: 16,
    borderRadius: 40,
    alignItems: "center",
  },
  captureText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "700",
  },

  closeBtn: {
    position: "absolute",
    top: 40,
    right: 20,
    backgroundColor: "#DC2626",
    padding: 10,
    borderRadius: 10,
  },
  closeText: { color: "#fff", fontWeight: "700" },

  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  button: { backgroundColor: "#2563EB", padding: 12, borderRadius: 8 },
  buttonText: { color: "#fff" },
});
