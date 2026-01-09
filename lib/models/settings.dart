// 应用设置模型（无Hive依赖）
class AppSettings {
  String apiEndpoint;
  String apiKey;
  String customPrompt;
  bool useBiometric;
  bool backupReminder;
  int backupReminderDays;  // 添加这个字段
  String? model;

  AppSettings({
    this.apiEndpoint = '',
    this.apiKey = '',
    this.customPrompt = 'Describe this image in detail, focusing on the main subject, colors, composition, and any notable elements.',
    this.useBiometric = false,
    this.backupReminder = true,
    this.backupReminderDays = 7,
    this.model,
  });

  AppSettings copyWith({
    String? apiEndpoint,
    String? apiKey,
    String? customPrompt,
    bool? useBiometric,
    bool? backupReminder,
    int? backupReminderDays,
    String? model,
  }) {
    return AppSettings(
      apiEndpoint: apiEndpoint ?? this.apiEndpoint,
      apiKey: apiKey ?? this.apiKey,
      customPrompt: customPrompt ?? this.customPrompt,
      useBiometric: useBiometric ?? this.useBiometric,
      backupReminder: backupReminder ?? this.backupReminder,
      backupReminderDays: backupReminderDays ?? this.backupReminderDays,
      model: model ?? this.model,
    );
  }
}
