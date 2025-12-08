import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Platform,
  Alert,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import projectsService from "../services/projectsService";
import DateTimePicker from "@react-native-community/datetimepicker";

export default function PlotRegistrationScreen() {
  const navigation = useNavigation();

  // Form states
  const [plotName, setPlotName] = useState("");
  const [area, setArea] = useState("");
  const [species, setSpecies] = useState("");
  const [remarks, setRemarks] = useState("");

  // Date picker states
  const [plantingDate, setPlantingDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const handleDateChange = (event, selectedDate) => {
    const currentDate = selectedDate || plantingDate;
    setShowDatePicker(false);
    setPlantingDate(currentDate);
  };

  const handleSubmit = () => {
    const data = {
      plotName,
      area,
      species,
      remarks,
      plantingDate: plantingDate.toISOString(),
    };
    (async () => {
      // basic validation
      if (!plotName || !area) {
        Alert.alert('Validation', 'Please provide plot name and area');
        return;
      }

      try {
        const token = await AsyncStorage.getItem('token');
        const payload = {
          title: plotName,
          description: remarks,
          areaHectares: Number(area),
          cropType: species, 
          metadata: { species },
          startDate: plantingDate.toISOString(),
        };

        // show simple inline feedback
        console.log('Submitting project', payload);
        const resp = await projectsService.createProject(token, payload);
        console.log('Project created', resp);
        Alert.alert('Success', 'Plot registered successfully');
        navigation.goBack();
      } catch (err) {
        console.error('Project creation error', err?.response ?? err);
        const msg = err?.response?.data?.message ?? err.message ?? 'Failed to create project';
        Alert.alert('Error', msg);
      }
    })();
  };

  return (
    <LinearGradient colors={["#0f4d92", "#0fa3b1", "#3bd27a"]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.innerContainer}>
        <Text style={styles.title}>Register New Plot</Text>

        {/* Plot Name */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Plot Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Plot Name"
            value={plotName}
            onChangeText={setPlotName}
          />
        </View>

        {/* Area */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Area (in hectares)</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Area"
            keyboardType="numeric"
            value={area}
            onChangeText={setArea}
          />
        </View>

        {/* Species */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Species</Text>
          <TextInput
            style={styles.input}
            placeholder="Enter Species"
            value={species}
            onChangeText={setSpecies}
          />
        </View>

        {/* Date Picker */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Date of Planting / Survey</Text>

          <TouchableOpacity
            style={styles.dateButton}
            onPress={() => setShowDatePicker(true)}
          >
            <Text style={styles.dateButtonText}>
              {plantingDate.toLocaleDateString()}
            </Text>
          </TouchableOpacity>

          {/* Web Date Picker */}
          {Platform.OS === "web" && showDatePicker && (
            <input
              type="date"
              value={plantingDate.toISOString().split("T")[0]}
              onChange={(e) => {
                setPlantingDate(new Date(e.target.value));
                setShowDatePicker(false);
              }}
              style={styles.webDateInput}
            />
          )}

          {/* Android + iOS Date Picker */}
          {Platform.OS !== "web" && showDatePicker && (
            <DateTimePicker
              value={plantingDate}
              mode="date"
              display={Platform.OS === "ios" ? "spinner" : "default"}
              onChange={handleDateChange}
            />
          )}
        </View>

        {/* Remarks */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Remarks</Text>
          <TextInput
            style={[styles.input, { height: 100 }]}
            placeholder="Additional Notes"
            value={remarks}
            onChangeText={setRemarks}
            multiline
          />
        </View>

        {/* Submit */}
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit</Text>
        </TouchableOpacity>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  innerContainer: {
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    color: "#fff",
    marginBottom: 6,
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
  },
  dateButton: {
    backgroundColor: "rgba(255,255,255,0.9)",
    borderRadius: 10,
    padding: 12,
  },
  dateButtonText: {
    fontSize: 16,
    color: "#000",
  },
  webDateInput: {
    padding: 12,
    marginTop: 10,
    borderRadius: 10,
    border: "1px solid #ccc",
    fontSize: 16,
  },
  submitButton: {
    backgroundColor: "#004aad",
    padding: 15,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 10,
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
});
