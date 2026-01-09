import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';

class SettingsScreen extends StatefulWidget {
  const SettingsScreen({super.key});

  @override
  State<SettingsScreen> createState() => _SettingsScreenState();
}

class _SettingsScreenState extends State<SettingsScreen> {
  late TextEditingController _apiEndpointController;
  late TextEditingController _apiKeyController;
  late TextEditingController _promptController;
  late TextEditingController _currentPinController;
  late TextEditingController _newPinController;
  late TextEditingController _confirmPinController;

  @override
  void initState() {
    super.initState();
    final settings = context.read<AppState>().settings;
    _apiEndpointController = TextEditingController(text: settings.apiEndpoint);
    _apiKeyController = TextEditingController(text: settings.apiKey);
    _promptController = TextEditingController(text: settings.customPrompt);
    _currentPinController = TextEditingController();
    _newPinController = TextEditingController();
    _confirmPinController = TextEditingController();
  }

  @override
  void dispose() {
    _apiEndpointController.dispose();
    _apiKeyController.dispose();
    _promptController.dispose();
    _currentPinController.dispose();
    _newPinController.dispose();
    _confirmPinController.dispose();
    super.dispose();
  }

  void _showChangePinDialog() {
    _currentPinController.clear();
    _newPinController.clear();
    _confirmPinController.clear();

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Change PIN'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: _currentPinController,
              obscureText: true,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(
                labelText: 'Current PIN',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _newPinController,
              obscureText: true,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(
                labelText: 'New PIN',
                border: OutlineInputBorder(),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _confirmPinController,
              obscureText: true,
              keyboardType: TextInputType.number,
              maxLength: 6,
              decoration: const InputDecoration(
                labelText: 'Confirm New PIN',
                border: OutlineInputBorder(),
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              final appState = context.read<AppState>();
              if (!appState.verifyPin(_currentPinController.text)) {
                _showError('Current PIN is incorrect');
                return;
              }
              if (_newPinController.text.length < 4) {
                _showError('PIN must be at least 4 digits');
                return;
              }
              if (_newPinController.text != _confirmPinController.text) {
                _showError('New PINs do not match');
                return;
              }
              appState.setPin(_newPinController.text);
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('PIN changed successfully')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showApiSettingsDialog() {
    final settings = context.read<AppState>().settings;
    _apiEndpointController.text = settings.apiEndpoint;
    _apiKeyController.text = settings.apiKey;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('API Settings'),
        content: SingleChildScrollView(
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              TextField(
                controller: _apiEndpointController,
                decoration: const InputDecoration(
                  labelText: 'API Endpoint',
                  hintText: 'https://api.openai.com/v1',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              TextField(
                controller: _apiKeyController,
                obscureText: true,
                decoration: const InputDecoration(
                  labelText: 'API Key',
                  hintText: 'sk-...',
                  border: OutlineInputBorder(),
                ),
              ),
              const SizedBox(height: 16),
              const Text(
                'Compatible with OpenAI API format (OpenAI, Claude, local models, etc.)',
                style: TextStyle(fontSize: 12, color: Colors.grey),
              ),
            ],
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              context.read<AppState>().updateSettings(
                apiEndpoint: _apiEndpointController.text,
                apiKey: _apiKeyController.text,
              );
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('API settings saved')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showPromptDialog() {
    final settings = context.read<AppState>().settings;
    _promptController.text = settings.customPrompt;

    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Custom Prompt'),
        content: SizedBox(
          width: double.maxFinite,
          child: TextField(
            controller: _promptController,
            maxLines: 8,
            decoration: const InputDecoration(
              hintText: 'Enter your custom prompt for AI tagging...\n\nExample: Describe this image in detail, including colors, objects, and composition.',
              border: OutlineInputBorder(),
            ),
          ),
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              _promptController.text = 'Describe this image in detail, focusing on the main subject, colors, composition, and any notable elements.';
            },
            child: const Text('Reset Default'),
          ),
          FilledButton(
            onPressed: () {
              context.read<AppState>().updateSettings(
                customPrompt: _promptController.text,
              );
              Navigator.pop(context);
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Prompt saved')),
              );
            },
            child: const Text('Save'),
          ),
        ],
      ),
    );
  }

  void _showExportDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Export Dataset'),
        content: const Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Export format:'),
            SizedBox(height: 8),
            Text(
              'dataset.zip\n'
              '├── images/\n'
              '│   ├── category1/\n'
              '│   │   ├── image1.jpg\n'
              '│   │   └── image1.txt\n'
              '│   └── category2/\n'
              '└── videos/\n'
              '    └── category1/',
              style: TextStyle(
                fontFamily: 'monospace',
                fontSize: 12,
              ),
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            onPressed: () {
              Navigator.pop(context);
              _exportDataset();
            },
            child: const Text('Export'),
          ),
        ],
      ),
    );
  }

  void _exportDataset() {
    // TODO: Implement actual export
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Exporting dataset...')),
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        final settings = appState.settings;

        return Scaffold(
          appBar: AppBar(
            title: const Text('Settings'),
          ),
          body: ListView(
            children: [
              // Security section
              _SectionHeader(title: 'Security'),
              ListTile(
                leading: const Icon(Icons.pin),
                title: const Text('Change PIN'),
                subtitle: const Text('Update your access PIN'),
                trailing: const Icon(Icons.chevron_right),
                onTap: _showChangePinDialog,
              ),
              SwitchListTile(
                secondary: const Icon(Icons.fingerprint),
                title: const Text('Biometric Unlock'),
                subtitle: const Text('Use fingerprint or face to unlock'),
                value: settings.useBiometric,
                onChanged: (value) {
                  appState.updateSettings(useBiometric: value);
                },
              ),

              const Divider(),

              // AI Settings section
              _SectionHeader(title: 'AI Settings'),
              ListTile(
                leading: const Icon(Icons.api),
                title: const Text('API Configuration'),
                subtitle: Text(
                  settings.apiEndpoint.isEmpty
                      ? 'Not configured'
                      : settings.apiEndpoint,
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: _showApiSettingsDialog,
              ),
              ListTile(
                leading: const Icon(Icons.text_snippet),
                title: const Text('Custom Prompt'),
                subtitle: Text(
                  settings.customPrompt.isEmpty
                      ? 'Using default prompt'
                      : '${settings.customPrompt.substring(0, settings.customPrompt.length.clamp(0, 30))}...',
                ),
                trailing: const Icon(Icons.chevron_right),
                onTap: _showPromptDialog,
              ),

              const Divider(),

              // Data Management section
              _SectionHeader(title: 'Data Management'),
              ListTile(
                leading: const Icon(Icons.file_download),
                title: const Text('Export Dataset'),
                subtitle: const Text('Export as ZIP with images and tags'),
                trailing: const Icon(Icons.chevron_right),
                onTap: _showExportDialog,
              ),
              SwitchListTile(
                secondary: const Icon(Icons.notifications),
                title: const Text('Backup Reminder'),
                subtitle: const Text('Periodic reminder to backup data'),
                value: settings.backupReminder,
                onChanged: (value) {
                  appState.updateSettings(backupReminder: value);
                },
              ),

              const Divider(),

              // About section
              _SectionHeader(title: 'About'),
              ListTile(
                leading: const Icon(Icons.info_outline),
                title: const Text('Version'),
                subtitle: const Text('1.0.0'),
              ),
              ListTile(
                leading: const Icon(Icons.code),
                title: const Text('Source Code'),
                subtitle: const Text('View on GitHub'),
                trailing: const Icon(Icons.open_in_new),
                onTap: () {
                  // TODO: Open GitHub URL
                },
              ),

              const SizedBox(height: 32),

              // Danger zone
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: OutlinedButton(
                  style: OutlinedButton.styleFrom(
                    foregroundColor: Colors.red,
                    side: const BorderSide(color: Colors.red),
                  ),
                  onPressed: () {
                    showDialog(
                      context: context,
                      builder: (context) => AlertDialog(
                        title: const Text('Clear All Data'),
                        content: const Text(
                          'This will delete all categories, media items, and settings. This action cannot be undone.',
                        ),
                        actions: [
                          TextButton(
                            onPressed: () => Navigator.pop(context),
                            child: const Text('Cancel'),
                          ),
                          FilledButton(
                            style: FilledButton.styleFrom(
                              backgroundColor: Colors.red,
                            ),
                            onPressed: () {
                              // TODO: Implement clear all data
                              Navigator.pop(context);
                              ScaffoldMessenger.of(context).showSnackBar(
                                const SnackBar(
                                  content: Text('All data cleared'),
                                ),
                              );
                            },
                            child: const Text('Delete Everything'),
                          ),
                        ],
                      ),
                    );
                  },
                  child: const Text('Clear All Data'),
                ),
              ),

              const SizedBox(height: 32),
            ],
          ),
        );
      },
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final String title;

  const _SectionHeader({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
      child: Text(
        title,
        style: TextStyle(
          fontSize: 14,
          fontWeight: FontWeight.bold,
          color: Theme.of(context).colorScheme.primary,
        ),
      ),
    );
  }
}
