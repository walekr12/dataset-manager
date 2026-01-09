import 'package:hive/hive.dart';

part 'settings.g.dart';

@HiveType(typeId: 3)
class AppSettings extends HiveObject {
  @HiveField(0)
  String apiEndpoint;

  @HiveField(1)
  String apiKey;

  @HiveField(2)
  String customPrompt;

  @HiveField(3)
  bool useBiometric;

  @HiveField(4)
  bool backupReminder;

  @HiveField(5)
  String? model;

  AppSettings({
    this.apiEndpoint = '',
    this.apiKey = '',
    this.customPrompt = 'Describe this image in detail, focusing on the main subject, colors, composition, and any notable elements.',
    this.useBiometric = false,
    this.backupReminder = true,
    this.model,
  });

  AppSettings copyWith({
    String? apiEndpoint,
    String? apiKey,
    String? customPrompt,
    bool? useBiometric,
    bool? backupReminder,
    String? model,
  }) {
    return AppSettings(
      apiEndpoint: apiEndpoint ?? this.apiEndpoint,
      apiKey: apiKey ?? this.apiKey,
      customPrompt: customPrompt ?? this.customPrompt,
      useBiometric: useBiometric ?? this.useBiometric,
      backupReminder: backupReminder ?? this.backupReminder,
      model: model ?? this.model,
    );
  }
}
