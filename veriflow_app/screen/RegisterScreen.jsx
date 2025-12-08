import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, SafeAreaView, ScrollView, Modal } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import authService from '../services/authService';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [serverMessage, setServerMessage] = useState(null);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Role options
  const roleOptions = [
    { label: 'Field Operator', value: 'farmer' },
    { label: 'Marketplace User', value: 'marketplaceuser' },
  ];

  const handleRegister = async () => {
    setError(null);

    if (!email || !password) {
      setError('Email and password are required');
      Alert.alert('Error', 'Email and password are required');
      return;
    }

    if (!role) {
      setError('Please select a role');
      Alert.alert('Error', 'Please select a role');
      return;
    }

    setLoading(true);

    try {
      const payload = { name, email, password, phone, role };
      const resp = await authService.register(payload);

      const { token, user } = resp;
      setServerMessage('Registration successful');

      if (!token) throw new Error('No token returned from server');

      await AsyncStorage.setItem('token', token);
      await AsyncStorage.setItem('role', role);

      Alert.alert('Registered', `Welcome ${user?.name ?? user?.email ?? ''}`);

      // Navigate to Marketplace if user is a marketplace user, otherwise to Login
      if (role === 'marketplaceuser') {
        navigation.navigate('Marketplace');
      } else {
        navigation.navigate('Login');
      }

      return user;

    } catch (err) {
      const respMsg = err?.response?.data?.message;
      if (respMsg) setServerMessage(respMsg);

      const msg = respMsg ?? err.message ?? 'Registration failed';
      setError(msg);
      Alert.alert('Registration failed', msg);

    } finally {
      setLoading(false);
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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Create Account</Text>
              <Text style={styles.subtitle}>Join Blue Carbon Registry</Text>
            </View>

            <View style={styles.form}>
              <TextInput
                style={styles.input}
                placeholder="Full name"
                placeholderTextColor="#999"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
              />

              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor="#999"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Phone (optional)"
                placeholderTextColor="#999"
                value={phone}
                onChangeText={setPhone}
                keyboardType="phone-pad"
              />

              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              {/* Role Dropdown */}
              <TouchableOpacity
                style={styles.dropdownButton}
                onPress={() => setShowRoleDropdown(true)}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownButtonText, !role && styles.placeholderText]}>
                  {role ? roleOptions.find(opt => opt.value === role)?.label : 'Select Role'}
                </Text>
                <Text style={styles.dropdownArrow}>▼</Text>
              </TouchableOpacity>

              {/* Modal */}
              <Modal
                visible={showRoleDropdown}
                transparent={true}
                animationType="fade"
                onRequestClose={() => setShowRoleDropdown(false)}
              >
                <TouchableOpacity
                  style={styles.modalOverlay}
                  activeOpacity={1}
                  onPress={() => setShowRoleDropdown(false)}
                >
                  <View style={styles.dropdownModal}>
                    <Text style={styles.dropdownTitle}>Select Your Role</Text>

                    {roleOptions.map((option, index) => (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dropdownOption,
                          role === option.value && styles.selectedOption,
                        ]}
                        onPress={() => {
                          setRole(option.value);
                          setShowRoleDropdown(false);
                        }}
                      >
                        <Text
                          style={[
                            styles.dropdownOptionText,
                            role === option.value && styles.selectedOptionText,
                          ]}
                        >
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </TouchableOpacity>
              </Modal>

              {serverMessage ? <Text style={styles.serverMessage}>{serverMessage}</Text> : null}

              <TouchableOpacity
                style={[styles.button, loading && styles.buttonDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.8}
              >
                <Text style={styles.buttonText}>{loading ? 'Creating...' : 'Register'}</Text>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => navigation.goBack()}>
                <Text style={styles.link}>Already have an account? Login</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  gradient: { flex: 1 },
  container: { flex: 1 },
  scrollContent: { flexGrow: 1 },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  header: { alignItems: 'center', marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#FFFFFF', opacity: 0.9 },
  form: { width: '100%' },

  input: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#333',
    marginBottom: 14,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    elevation: 5,
  },

  dropdownButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    elevation: 5,
  },
  dropdownButtonText: { fontSize: 16, color: '#333' },
  placeholderText: { color: '#999' },
  dropdownArrow: { fontSize: 12, color: '#666' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  dropdownModal: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '80%',
    maxWidth: 400,
    paddingVertical: 20,
    elevation: 10,
  },

  dropdownTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    textAlign: 'center',
    marginBottom: 16,
  },

  dropdownOption: {
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },

  selectedOption: { backgroundColor: '#E8F0FE' },
  dropdownOptionText: { fontSize: 16, color: '#333' },
  selectedOptionText: { color: '#4A90E2', fontWeight: '600' },

  button: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 6,
    elevation: 8,
  },
  buttonDisabled: { opacity: 0.6 },
  buttonText: { color: '#5A7FE2', fontSize: 18, fontWeight: '600' },
  link: { textAlign: 'center', marginTop: 20, color: '#FFFFFF', fontSize: 15 },
  serverMessage: { textAlign: 'center', marginBottom: 8, color: '#FFFFFF', fontSize: 14 },
});

export default RegisterScreen;
