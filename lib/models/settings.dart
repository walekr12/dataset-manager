class AppSettings {
  String apiUrl;
  String apiKey;
  String selectedModel;
  String systemPrompt;
  String userPrompt;
  int backupReminderDays;

  AppSettings({
    this.apiUrl = 'https://api.openai.com/v1',
    this.apiKey = '',
    this.selectedModel = '',
    this.systemPrompt = '你是一个专业的图片描述专家，请详细描述图片内容。',
    this.userPrompt = '请用简洁的语言描述这张图片的内容，包括主体、场景、风格等。',
    this.backupReminderDays = 14,
  });

  Map<String, dynamic> toJson() => {
    'apiUrl': apiUrl,
    'apiKey': apiKey,
    'selectedModel': selectedModel,
    'systemPrompt': systemPrompt,
    'userPrompt': userPrompt,
    'backupReminderDays': backupReminderDays,
  };

  factory AppSettings.fromJson(Map<String, dynamic> json) => AppSettings(
    apiUrl: json['apiUrl'] ?? 'https://api.openai.com/v1',
    apiKey: json['apiKey'] ?? '',
    selectedModel: json['selectedModel'] ?? '',
    systemPrompt: json['systemPrompt'] ?? '你是一个专业的图片描述专家，请详细描述图片内容。',
    userPrompt: json['userPrompt'] ?? '请用简洁的语言描述这张图片的内容，包括主体、场景、风格等。',
    backupReminderDays: json['backupReminderDays'] ?? 14,
  );
}
