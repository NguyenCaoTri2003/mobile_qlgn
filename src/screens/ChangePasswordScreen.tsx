import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Dimensions,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { usersService } from '../services/user.service';

const { width, height } = Dimensions.get('window');

export const ChangePasswordScreen = () => {
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  const [showOldPassword, setShowOldPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({
    newPassword: '',
    confirmPassword: '',
  });

  // Real-time validation
  useEffect(() => {
    let newErrors = { newPassword: '', confirmPassword: '' };
    
    // Kiểm tra mật khẩu mới
    if (newPassword && newPassword.length < 8) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    } else if (newPassword && !/(?=.*[A-Z])/.test(newPassword)) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 1 chữ hoa';
    } else if (newPassword && !/(?=.*[0-9])/.test(newPassword)) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 1 số';
    } else {
      newErrors.newPassword = '';
    }
    
    // Kiểm tra xác nhận mật khẩu
    if (confirmPassword && newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    } else {
      newErrors.confirmPassword = '';
    }
    
    setErrors(newErrors);
  }, [newPassword, confirmPassword]);

  // Kiểm tra form có hợp lệ không
  const isFormValid = () => {
    return (
      oldPassword.trim() !== '' &&
      newPassword.trim() !== '' &&
      confirmPassword.trim() !== '' &&
      errors.newPassword === '' &&
      errors.confirmPassword === '' &&
      newPassword.length >= 8
    );
  };

  const handleChangePassword = async () => {
    if (!isFormValid()) return;
    
    setLoading(true);
    try {
      const response = await usersService.changePassword(oldPassword, newPassword);
      Alert.alert('Thành công', 'Đổi mật khẩu thành công');
      // Reset form
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setErrors({ newPassword: '', confirmPassword: '' });
      Keyboard.dismiss(); // Ẩn bàn phím sau khi thành công
    } catch (error: any) {
      Alert.alert('Lỗi', error?.response?.data?.message || 'Đổi mật khẩu thất bại');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <ScrollView 
          contentContainerStyle={styles.container}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Các hình tròn trang trí */}
          <View style={styles.circle1} />
          <View style={styles.circle2} />
          <View style={styles.circle3} />
          
          <View style={styles.card}>
            <View style={styles.header}>
              <View style={styles.iconCircle}>
                <Ionicons name="lock-closed-outline" size={32} color="#007AFF" />
              </View>
              <Text style={styles.title}>Đổi mật khẩu</Text>
              <Text style={styles.subtitle}>Tăng cường bảo mật tài khoản</Text>
            </View>

            {/* Mật khẩu cũ */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                <Ionicons name="key-outline" size={16} color="#007AFF" /> Mật khẩu cũ
              </Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.input}
                  value={oldPassword}
                  onChangeText={setOldPassword}
                  secureTextEntry={!showOldPassword}
                  placeholder="Nhập mật khẩu cũ"
                  placeholderTextColor="#999"
                  editable={!loading}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowOldPassword(!showOldPassword)}
                >
                  <Ionicons
                    name={showOldPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#007AFF"
                  />
                </TouchableOpacity>
              </View>
            </View>

            {/* Mật khẩu mới */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                <Ionicons name="shield-outline" size={16} color="#007AFF" /> Mật khẩu mới
              </Text>
              <View style={[
                styles.passwordContainer,
                errors.newPassword ? styles.inputError : null
              ]}>
                <TextInput
                  style={styles.input}
                  value={newPassword}
                  onChangeText={setNewPassword}
                  secureTextEntry={!showNewPassword}
                  placeholder="Nhập mật khẩu mới"
                  placeholderTextColor="#999"
                  editable={!loading}
                  returnKeyType="next"
                  blurOnSubmit={false}
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowNewPassword(!showNewPassword)}
                >
                  <Ionicons
                    name={showNewPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#007AFF"
                  />
                </TouchableOpacity>
              </View>
              {errors.newPassword ? (
                <Text style={styles.errorText}>{errors.newPassword}</Text>
              ) : (
                <Text style={styles.hintText}>
                  • Tối thiểu 8 ký tự • Ít nhất 1 chữ hoa • Ít nhất 1 số
                </Text>
              )}
            </View>

            {/* Xác nhận mật khẩu mới */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                <Ionicons name="checkmark-circle-outline" size={16} color="#007AFF" /> Xác nhận mật khẩu mới
              </Text>
              <View style={[
                styles.passwordContainer,
                errors.confirmPassword ? styles.inputError : null
              ]}>
                <TextInput
                  style={styles.input}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="Nhập lại mật khẩu mới"
                  placeholderTextColor="#999"
                  editable={!loading}
                  returnKeyType="done"
                />
                <TouchableOpacity
                  style={styles.eyeIcon}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  <Ionicons
                    name={showConfirmPassword ? "eye-off" : "eye"}
                    size={20}
                    color="#007AFF"
                  />
                </TouchableOpacity>
              </View>
              {errors.confirmPassword ? (
                <Text style={styles.errorText}>{errors.confirmPassword}</Text>
              ) : null}
            </View>

            {/* Nút đổi mật khẩu */}
            <TouchableOpacity
              style={[styles.button, (!isFormValid() || loading) && styles.buttonDisabled]}
              onPress={handleChangePassword}
              disabled={!isFormValid() || loading}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <>
                  <Ionicons name="refresh-outline" size={20} color="#fff" style={styles.buttonIcon} />
                  <Text style={styles.buttonText}>Đổi mật khẩu</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Text thông báo liên hệ IT */}
            <View style={styles.noteContainer}>
              <View style={styles.noteIcon}>
                <Ionicons name="call-outline" size={14} color="#007AFF" />
              </View>
              <Text style={styles.noteText}>
                Quên mật khẩu? Vui lòng liên hệ <Text style={styles.boldText}>Phòng IT</Text> để được hỗ trợ
              </Text>
            </View>
          </View>
          {/* Thêm khoảng trống ở cuối để tránh bị che khi bàn phím hiện lên */}
          <View style={styles.bottomSpacing} />
        </ScrollView>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    padding: 16,
    backgroundColor: '#e8f0fe',
    justifyContent: 'center',
    position: 'relative',
    paddingBottom: Platform.OS === 'ios' ? 40 : 20,
  },
  bottomSpacing: {
    height: Platform.OS === 'ios' ? 30 : 20,
  },
  // Hình tròn trang trí
  circle1: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
  },
  circle2: {
    position: 'absolute',
    bottom: -80,
    left: -80,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(0, 122, 255, 0.08)',
  },
  circle3: {
    position: 'absolute',
    top: '30%',
    left: -30,
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(0, 122, 255, 0.05)',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.2)',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(0, 122, 255, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(0, 122, 255, 0.3)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a2e',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#666',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 14,
    fontSize: 15,
    color: '#333',
  },
  inputError: {
    borderColor: '#ff4757',
    backgroundColor: '#fff5f5',
  },
  eyeIcon: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  errorText: {
    fontSize: 11,
    color: '#ff4757',
    marginTop: 6,
    marginLeft: 4,
  },
  hintText: {
    fontSize: 11,
    color: '#888',
    marginTop: 6,
    marginLeft: 4,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    marginBottom: 20,
    flexDirection: 'row',
    shadowColor: '#007AFF',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    backgroundColor: '#ccc',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '600',
  },
  buttonIcon: {
    marginRight: 8,
  },
  noteContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
  },
  noteIcon: {
    marginRight: 6,
  },
  noteText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },
  boldText: {
    fontWeight: '700',
    color: '#007AFF',
  },
});

export default ChangePasswordScreen;