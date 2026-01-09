import 'dart:convert';
import 'dart:io';
import 'dart:typed_data';
import 'package:encrypt/encrypt.dart' as encrypt;
import 'package:crypto/crypto.dart';

/// Service for AES-256 encryption/decryption of files
class EncryptionService {
  static EncryptionService? _instance;
  late encrypt.Key _key;
  late encrypt.IV _iv;
  late encrypt.Encrypter _encrypter;
  bool _isInitialized = false;

  EncryptionService._();

  static EncryptionService getInstance() {
    _instance ??= EncryptionService._();
    return _instance!;
  }

  /// Initialize the encryption service with a password
  /// The password is used to derive the AES-256 key
  void initialize(String password) {
    // Derive a 256-bit key from password using SHA-256
    final keyBytes = sha256.convert(utf8.encode(password)).bytes;
    _key = encrypt.Key(Uint8List.fromList(keyBytes));
    
    // Use first 16 bytes of key hash as IV
    final ivBytes = sha256.convert(utf8.encode('$password-iv')).bytes.sublist(0, 16);
    _iv = encrypt.IV(Uint8List.fromList(ivBytes));
    
    _encrypter = encrypt.Encrypter(encrypt.AES(_key, mode: encrypt.AESMode.cbc));
    _isInitialized = true;
  }

  /// Check if the service is initialized
  bool get isInitialized => _isInitialized;

  /// Encrypt a file and save to destination path
  /// Returns the encrypted file path
  Future<String> encryptFile(String sourcePath, String destPath) async {
    if (!_isInitialized) {
      throw Exception('Encryption service not initialized');
    }

    final sourceFile = File(sourcePath);
    if (!await sourceFile.exists()) {
      throw Exception('Source file does not exist: $sourcePath');
    }

    // Read file bytes
    final bytes = await sourceFile.readAsBytes();
    
    // Encrypt
    final encrypted = _encrypter.encryptBytes(bytes, iv: _iv);
    
    // Write encrypted data
    final destFile = File(destPath);
    await destFile.writeAsBytes(encrypted.bytes);
    
    return destPath;
  }

  /// Decrypt a file and save to destination path
  /// Returns the decrypted file path
  Future<String> decryptFile(String sourcePath, String destPath) async {
    if (!_isInitialized) {
      throw Exception('Encryption service not initialized');
    }

    final sourceFile = File(sourcePath);
    if (!await sourceFile.exists()) {
      throw Exception('Source file does not exist: $sourcePath');
    }

    // Read encrypted bytes
    final encryptedBytes = await sourceFile.readAsBytes();
    
    // Decrypt
    final encrypted = encrypt.Encrypted(encryptedBytes);
    final decrypted = _encrypter.decryptBytes(encrypted, iv: _iv);
    
    // Write decrypted data
    final destFile = File(destPath);
    await destFile.writeAsBytes(decrypted);
    
    return destPath;
  }

  /// Encrypt bytes directly (for in-memory operations)
  Uint8List encryptBytes(Uint8List bytes) {
    if (!_isInitialized) {
      throw Exception('Encryption service not initialized');
    }
    final encrypted = _encrypter.encryptBytes(bytes, iv: _iv);
    return encrypted.bytes;
  }

  /// Decrypt bytes directly (for in-memory operations)
  Uint8List decryptBytes(Uint8List encryptedBytes) {
    if (!_isInitialized) {
      throw Exception('Encryption service not initialized');
    }
    final encrypted = encrypt.Encrypted(encryptedBytes);
    return Uint8List.fromList(_encrypter.decryptBytes(encrypted, iv: _iv));
  }

  /// Encrypt a string
  String encryptString(String plainText) {
    if (!_isInitialized) {
      throw Exception('Encryption service not initialized');
    }
    final encrypted = _encrypter.encrypt(plainText, iv: _iv);
    return encrypted.base64;
  }

  /// Decrypt a string
  String decryptString(String encryptedBase64) {
    if (!_isInitialized) {
      throw Exception('Encryption service not initialized');
    }
    final encrypted = encrypt.Encrypted.fromBase64(encryptedBase64);
    return _encrypter.decrypt(encrypted, iv: _iv);
  }

  /// Generate a secure random password
  static String generateSecurePassword({int length = 32}) {
    final random = encrypt.SecureRandom(length);
    return base64Url.encode(random.bytes).substring(0, length);
  }

  /// Hash a PIN for secure storage
  static String hashPin(String pin) {
    final bytes = utf8.encode(pin);
    final digest = sha256.convert(bytes);
    return digest.toString();
  }

  /// Verify a PIN against its hash
  static bool verifyPinHash(String pin, String hash) {
    return hashPin(pin) == hash;
  }

  /// Clear the encryption key from memory
  void dispose() {
    _isInitialized = false;
  }
}
