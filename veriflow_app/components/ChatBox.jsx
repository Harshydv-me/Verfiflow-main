import React, { useState, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  ScrollView,
  Alert,
} from "react-native";
import { Audio } from "expo-av";
import { Ionicons } from "@expo/vector-icons";

const ChatBox = ({ apiUrl = "http://YOUR_API_URL:8000" }) => {
  const [message, setMessage] = useState("");
  const [chatMessages, setChatMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);

  // Send text query to API
  const sendTextQuery = async () => {
    if (!message.trim()) return;

    const userMessage = message.trim();
    setMessage("");
    setChatMessages((prev) => [...prev, { type: "user", text: userMessage }]);
    setLoading(true);

    try {
      const response = await fetch(`${apiUrl}/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: userMessage,
          language: "en-US",
          k: 4,
          enable_tts: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { type: "bot", text: data.answer },
      ]);
    } catch (error) {
      console.error("Error sending query:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, I couldn't process your request. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  // Start recording audio
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (permission.status !== "granted") {
        Alert.alert(
          "Permission Required",
          "Please allow microphone access to use voice input."
        );
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );

      setRecording(recording);
      setIsRecording(true);
    } catch (error) {
      console.error("Failed to start recording:", error);
      Alert.alert("Error", "Failed to start recording. Please try again.");
    }
  };

  // Stop recording and send to API
  const stopRecording = async () => {
    if (!recording) return;

    setIsRecording(false);
    setLoading(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();

      setChatMessages((prev) => [
        ...prev,
        { type: "user", text: "[Voice Message]" },
      ]);

      // Create FormData for audio upload
      const formData = new FormData();
      formData.append("audio", {
        uri: uri,
        type: "audio/wav",
        name: "recording.wav",
      });
      formData.append("language", "en-US");
      formData.append("k", "4");
      formData.append("enable_tts", "false");

      const response = await fetch(`${apiUrl}/query-with-audio`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      setChatMessages((prev) => [
        ...prev,
        { type: "bot", text: data.answer },
      ]);
    } catch (error) {
      console.error("Error processing voice query:", error);
      setChatMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text: "Sorry, I couldn't process your voice message. Please try again.",
        },
      ]);
    } finally {
      setRecording(null);
      setLoading(false);
    }
  };

  return (
    <>
      {/* Chat Toggle Button */}
      {!isChatOpen && (
        <TouchableOpacity
          style={styles.floatingButton}
          onPress={() => setIsChatOpen(true)}
          activeOpacity={0.8}
        >
          <Ionicons name="chatbubble-ellipses" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      {/* Chat Modal */}
      <Modal
        visible={isChatOpen}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsChatOpen(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.chatContainer}>
            {/* Chat Header */}
            <View style={styles.chatHeader}>
              <Text style={styles.chatHeaderText}>FAQ Assistant</Text>
              <TouchableOpacity onPress={() => setIsChatOpen(false)}>
                <Ionicons name="close" size={24} color="#FFFFFF" />
              </TouchableOpacity>
            </View>

            {/* Chat Messages */}
            <ScrollView
              style={styles.messagesContainer}
              contentContainerStyle={styles.messagesContent}
            >
              {chatMessages.length === 0 && (
                <Text style={styles.emptyText}>
                  Ask me anything about Blue Carbon!
                </Text>
              )}
              {chatMessages.map((msg, index) => (
                <View
                  key={index}
                  style={[
                    styles.messageBubble,
                    msg.type === "user"
                      ? styles.userBubble
                      : styles.botBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      msg.type === "user"
                        ? styles.userText
                        : styles.botText,
                    ]}
                  >
                    {msg.text}
                  </Text>
                </View>
              ))}
              {loading && (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text style={styles.loadingText}>Thinking...</Text>
                </View>
              )}
            </ScrollView>

            {/* Input Area */}
            <View style={styles.inputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type your question..."
                placeholderTextColor="#999"
                value={message}
                onChangeText={setMessage}
                editable={!loading && !isRecording}
                onSubmitEditing={sendTextQuery}
                returnKeyType="send"
              />

              {/* Voice Recording Button */}
              <TouchableOpacity
                style={[
                  styles.voiceButton,
                  isRecording && styles.voiceButtonActive,
                ]}
                onPress={isRecording ? stopRecording : startRecording}
                disabled={loading}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={isRecording ? "stop-circle" : "mic"}
                  size={24}
                  color="#FFFFFF"
                />
              </TouchableOpacity>

              {/* Send Button */}
              <TouchableOpacity
                style={styles.sendButton}
                onPress={sendTextQuery}
                disabled={loading || !message.trim() || isRecording}
                activeOpacity={0.7}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  floatingButton: {
    position: "absolute",
    right: 20,
    bottom: 20,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  chatContainer: {
    height: "80%",
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: "hidden",
  },
  chatHeader: {
    backgroundColor: "#4A90E2",
    padding: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatHeaderText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "bold",
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: "#F5F5F5",
  },
  messagesContent: {
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    color: "#999",
    fontSize: 16,
    marginTop: 20,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  userBubble: {
    alignSelf: "flex-end",
    backgroundColor: "#4A90E2",
  },
  botBubble: {
    alignSelf: "flex-start",
    backgroundColor: "#E0E0E0",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  userText: {
    color: "#FFFFFF",
  },
  botText: {
    color: "#333333",
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    backgroundColor: "#E0E0E0",
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
  },
  loadingText: {
    marginLeft: 8,
    color: "#666",
    fontSize: 14,
  },
  inputContainer: {
    flexDirection: "row",
    padding: 12,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    alignItems: "center",
  },
  textInput: {
    flex: 1,
    backgroundColor: "#F5F5F5",
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    marginRight: 8,
    maxHeight: 100,
  },
  voiceButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#7B68EE",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 8,
  },
  voiceButtonActive: {
    backgroundColor: "#FF4444",
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#4A90E2",
    justifyContent: "center",
    alignItems: "center",
  },
});

export default ChatBox;
