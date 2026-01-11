import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:local_auth/local_auth.dart';
import '../providers/app_state.dart';
import '../theme/app_theme.dart';

class LockScreen extends StatefulWidget {
  const LockScreen({super.key});

  @override
  State<LockScreen> createState() => _LockScreenState();
}

class _LockScreenState extends State<LockScreen> {
  String _enteredPin = '';
  bool _hasError = false;
  bool _biometricsAvailable = false;
  final LocalAuthentication _localAuth = LocalAuthentication();

  @override
  void initState() {
    super.initState();
    _checkBiometrics();
  }

  Future<void> _checkBiometrics() async {
    try {
      // 检查设备是否支持生物识别
      final canAuthenticateWithBiometrics = await _localAuth.canCheckBiometrics;
      final canAuthenticate = canAuthenticateWithBiometrics || await _localAuth.isDeviceSupported();
      
      if (canAuthenticate) {
        // 检查是否有已注册的生物识别
        final availableBiometrics = await _localAuth.getAvailableBiometrics();
        if (mounted) {
          setState(() {
            _biometricsAvailable = availableBiometrics.isNotEmpty;
          });
        }
      }
    } catch (e) {
      debugPrint('Biometrics check error: $e');
      // 如果检查失败，默认不显示指纹按钮
      if (mounted) {
        setState(() {
          _biometricsAvailable = false;
        });
      }
    }
  }

  Future<void> _authenticateWithBiometrics() async {
    if (!_biometricsAvailable) {
      _showToast('设备不支持指纹识别');
      return;
    }
    
    try {
      final authenticated = await _localAuth.authenticate(
        localizedReason: '使用指纹解锁SecureDataset',
        options: const AuthenticationOptions(
          stickyAuth: true,
          biometricOnly: true,
        ),
      );
      if (authenticated && mounted) {
        _unlock();
      }
    } catch (e) {
      debugPrint('Biometric auth error: $e');
      _showToast('指纹验证失败');
    }
  }

  void _onNumberPressed(String number) {
    if (_enteredPin.length < 6) {
      setState(() {
        _enteredPin += number;
        _hasError = false;
      });

      if (_enteredPin.length == 6) {
        _verifyPin();
      }
    }
  }

  void _onBackspace() {
    if (_enteredPin.isNotEmpty) {
      setState(() {
        _enteredPin = _enteredPin.substring(0, _enteredPin.length - 1);
        _hasError = false;
      });
    }
  }

  void _verifyPin() {
    final appState = context.read<AppState>();
    if (appState.verifyPin(_enteredPin)) {
      _unlock();
    } else {
      setState(() => _hasError = true);
      _showToast('PIN码错误');
      Future.delayed(const Duration(milliseconds: 500), () {
        if (mounted) setState(() { _enteredPin = ''; _hasError = false; });
      });
    }
  }

  void _unlock() => Navigator.pushReplacementNamed(context, '/home');

  void _showToast(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), behavior: SnackBarBehavior.floating),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Container(
        decoration: const BoxDecoration(
          gradient: LinearGradient(
            begin: Alignment.topCenter,
            end: Alignment.bottomCenter,
            colors: [AppTheme.surfaceColor, AppTheme.bgColor],
          ),
        ),
        child: SafeArea(
          child: Center(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(24),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Container(
                    width: 80, height: 80,
                    decoration: BoxDecoration(
                      gradient: const LinearGradient(colors: [AppTheme.primaryColor, AppTheme.primaryDark]),
                      borderRadius: BorderRadius.circular(40),
                    ),
                    child: const Icon(Icons.lock_outline, size: 40, color: Colors.white),
                  ),
                  const SizedBox(height: 24),
                  ShaderMask(
                    shaderCallback: (bounds) => const LinearGradient(
                      colors: [AppTheme.primaryLight, AppTheme.primaryColor],
                    ).createShader(bounds),
                    child: const Text('SecureDataset', style: TextStyle(fontSize: 28, fontWeight: FontWeight.bold, color: Colors.white)),
                  ),
                  const SizedBox(height: 8),
                  const Text('输入PIN码解锁', style: TextStyle(color: AppTheme.textSecondary)),
                  const SizedBox(height: 32),
                  Row(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: List.generate(6, (i) {
                      final filled = i < _enteredPin.length;
                      return AnimatedContainer(
                        duration: const Duration(milliseconds: 200),
                        margin: const EdgeInsets.symmetric(horizontal: 8),
                        width: 14, height: 14,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          color: filled ? (_hasError ? AppTheme.errorColor : AppTheme.primaryColor) : Colors.transparent,
                          border: Border.all(color: _hasError ? AppTheme.errorColor : AppTheme.primaryColor, width: 2),
                        ),
                      );
                    }),
                  ),
                  const SizedBox(height: 40),
                  _buildPinPad(),
                ],
              ),
            ),
          ),
        ),
      ),
    );
  }

  Widget _buildPinPad() {
    return SizedBox(
      width: 280,
      child: Column(
        children: [
          for (int row = 0; row < 4; row++)
            Padding(
              padding: const EdgeInsets.only(bottom: 16),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [for (int col = 0; col < 3; col++) _buildPinButton(row, col)],
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildPinButton(int row, int col) {
    String? text;
    IconData? icon;
    VoidCallback? onPressed;
    bool isDisabled = false;

    if (row < 3) {
      text = (row * 3 + col + 1).toString();
      onPressed = () => _onNumberPressed(text!);
    } else {
      if (col == 0) { 
        icon = Icons.fingerprint; 
        onPressed = _biometricsAvailable ? _authenticateWithBiometrics : null;
        isDisabled = !_biometricsAvailable;
      }
      else if (col == 1) { text = '0'; onPressed = () => _onNumberPressed('0'); }
      else { icon = Icons.backspace_outlined; onPressed = _onBackspace; }
    }

    return Material(
      color: AppTheme.surfaceColor,
      borderRadius: BorderRadius.circular(35),
      child: InkWell(
        onTap: onPressed,
        borderRadius: BorderRadius.circular(35),
        child: Container(
          width: 70, height: 70,
          alignment: Alignment.center,
          child: text != null
              ? Text(text, style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w500, color: AppTheme.textPrimary))
              : Icon(icon, size: 28, color: isDisabled ? AppTheme.textSecondary : AppTheme.textPrimary),
        ),
      ),
    );
  }
}
