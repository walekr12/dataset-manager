import 'dart:convert';
import 'dart:io';
import 'package:dio/dio.dart';

/// Service for calling OpenAI-compatible vision APIs
class ApiService {
  static ApiService? _instance;
  late Dio _dio;
  String _endpoint = '';
  String _apiKey = '';
  String _model = 'gpt-4-vision-preview';

  ApiService._() {
    _dio = Dio();
    _dio.options.connectTimeout = const Duration(seconds: 30);
    _dio.options.receiveTimeout = const Duration(seconds: 120);
  }

  static ApiService getInstance() {
    _instance ??= ApiService._();
    return _instance!;
  }

  /// Configure the API endpoint and key
  void configure({
    required String endpoint,
    required String apiKey,
    String? model,
  }) {
    _endpoint = endpoint.endsWith('/') 
        ? endpoint.substring(0, endpoint.length - 1) 
        : endpoint;
    _apiKey = apiKey;
    if (model != null && model.isNotEmpty) {
      _model = model;
    }
  }

  /// Check if the service is configured
  bool get isConfigured => _endpoint.isNotEmpty && _apiKey.isNotEmpty;

  /// Generate a description for an image using vision API
  /// [imagePath] - Path to the image file
  /// [prompt] - Custom prompt for the AI
  /// Returns the generated description
  Future<String> generateImageDescription({
    required String imagePath,
    required String prompt,
  }) async {
    if (!isConfigured) {
      throw Exception('API service not configured. Please set endpoint and API key.');
    }

    final file = File(imagePath);
    if (!await file.exists()) {
      throw Exception('Image file not found: $imagePath');
    }

    // Read and encode image to base64
    final bytes = await file.readAsBytes();
    final base64Image = base64Encode(bytes);
    
    // Determine MIME type from extension
    final extension = imagePath.toLowerCase().split('.').last;
    String mimeType;
    switch (extension) {
      case 'png':
        mimeType = 'image/png';
        break;
      case 'gif':
        mimeType = 'image/gif';
        break;
      case 'webp':
        mimeType = 'image/webp';
        break;
      default:
        mimeType = 'image/jpeg';
    }

    // Build request body (OpenAI format)
    final requestBody = {
      'model': _model,
      'messages': [
        {
          'role': 'user',
          'content': [
            {
              'type': 'text',
              'text': prompt,
            },
            {
              'type': 'image_url',
              'image_url': {
                'url': 'data:$mimeType;base64,$base64Image',
              },
            },
          ],
        },
      ],
      'max_tokens': 500,
    };

    try {
      final response = await _dio.post(
        '$_endpoint/chat/completions',
        data: requestBody,
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiKey',
            'Content-Type': 'application/json',
          },
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['choices'] != null && data['choices'].isNotEmpty) {
          return data['choices'][0]['message']['content'] ?? '';
        }
        throw Exception('Invalid API response format');
      } else {
        throw Exception('API request failed with status ${response.statusCode}');
      }
    } on DioException catch (e) {
      if (e.response != null) {
        throw Exception('API error: ${e.response?.data}');
      }
      throw Exception('Network error: ${e.message}');
    }
  }

  /// Generate descriptions for multiple images
  /// Returns a map of image paths to their descriptions
  Future<Map<String, String>> generateBatchDescriptions({
    required List<String> imagePaths,
    required String prompt,
    Function(int completed, int total)? onProgress,
  }) async {
    final results = <String, String>{};
    
    for (int i = 0; i < imagePaths.length; i++) {
      try {
        final description = await generateImageDescription(
          imagePath: imagePaths[i],
          prompt: prompt,
        );
        results[imagePaths[i]] = description;
      } catch (e) {
        results[imagePaths[i]] = 'Error: $e';
      }
      
      onProgress?.call(i + 1, imagePaths.length);
      
      // Small delay to avoid rate limiting
      if (i < imagePaths.length - 1) {
        await Future.delayed(const Duration(milliseconds: 500));
      }
    }
    
    return results;
  }

  /// Test the API connection
  Future<bool> testConnection() async {
    if (!isConfigured) {
      return false;
    }

    try {
      final response = await _dio.get(
        '$_endpoint/models',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiKey',
          },
        ),
      );
      return response.statusCode == 200;
    } catch (e) {
      return false;
    }
  }

  /// Get available models from the API
  Future<List<String>> getAvailableModels() async {
    if (!isConfigured) {
      return [];
    }

    try {
      final response = await _dio.get(
        '$_endpoint/models',
        options: Options(
          headers: {
            'Authorization': 'Bearer $_apiKey',
          },
        ),
      );

      if (response.statusCode == 200) {
        final data = response.data;
        if (data['data'] != null) {
          return (data['data'] as List)
              .map((model) => model['id'] as String)
              .toList();
        }
      }
      return [];
    } catch (e) {
      return [];
    }
  }

  /// Set the model to use
  void setModel(String model) {
    _model = model;
  }

  /// Get current model
  String get currentModel => _model;
}
