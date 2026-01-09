import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../providers/app_state.dart';
import '../models/media_item.dart';

class ImageViewScreen extends StatefulWidget {
  final MediaItem item;

  const ImageViewScreen({super.key, required this.item});

  @override
  State<ImageViewScreen> createState() => _ImageViewScreenState();
}

class _ImageViewScreenState extends State<ImageViewScreen> {
  late TextEditingController _tagController;
  bool _isEditing = false;
  bool _isLoading = false;

  @override
  void initState() {
    super.initState();
    _tagController = TextEditingController(text: widget.item.aiTag ?? '');
  }

  @override
  void dispose() {
    _tagController.dispose();
    super.dispose();
  }

  Future<void> _generateAiTag() async {
    final appState = context.read<AppState>();
    final settings = appState.settings;

    if (settings.apiEndpoint.isEmpty || settings.apiKey.isEmpty) {
      _showError('Please configure API settings first');
      return;
    }

    setState(() => _isLoading = true);

    try {
      // TODO: Call API service to generate tag
      await Future.delayed(const Duration(seconds: 2)); // Simulate API call
      
      // Simulated response
      const simulatedTag = 'A detailed description of the image content...';
      _tagController.text = simulatedTag;
      
      // Save the tag
      await appState.updateMediaItemTag(widget.item.id, simulatedTag);
      
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('AI tag generated successfully')),
        );
      }
    } catch (e) {
      _showError('Failed to generate AI tag: $e');
    } finally {
      if (mounted) {
        setState(() => _isLoading = false);
      }
    }
  }

  Future<void> _saveTag() async {
    final appState = context.read<AppState>();
    await appState.updateMediaItemTag(widget.item.id, _tagController.text);
    setState(() => _isEditing = false);
    if (mounted) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Tag saved')),
      );
    }
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _showDeleteConfirmDialog() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Item'),
        content: const Text('Are you sure you want to delete this item?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              context.read<AppState>().deleteMediaItem(widget.item.id);
              Navigator.pop(context); // Close dialog
              Navigator.pop(context); // Go back to category detail
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      backgroundColor: Colors.black,
      appBar: AppBar(
        backgroundColor: Colors.transparent,
        title: Text(
          widget.item.type == MediaType.video ? 'Video' : 'Image',
        ),
        actions: [
          IconButton(
            icon: const Icon(Icons.delete),
            onPressed: _showDeleteConfirmDialog,
          ),
        ],
      ),
      body: Column(
        children: [
          // Image/Video preview
          Expanded(
            flex: 3,
            child: InteractiveViewer(
              minScale: 0.5,
              maxScale: 4.0,
              child: Center(
                child: _buildPreview(),
              ),
            ),
          ),
          // Info bar
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
            color: Colors.black87,
            child: Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Text(
                  '${widget.item.width} x ${widget.item.height}',
                  style: const TextStyle(color: Colors.white70),
                ),
                Text(
                  widget.item.type == MediaType.video ? 'VIDEO' : 'IMAGE',
                  style: TextStyle(
                    color: Theme.of(context).colorScheme.primary,
                    fontWeight: FontWeight.bold,
                  ),
                ),
              ],
            ),
          ),
          // Tag section
          Expanded(
            flex: 2,
            child: Container(
              color: Theme.of(context).colorScheme.surface,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  // Tag header
                  Padding(
                    padding: const EdgeInsets.all(16),
                    child: Row(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [
                        const Text(
                          'AI Tag / Description',
                          style: TextStyle(
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                        Row(
                          children: [
                            if (_isEditing)
                              TextButton(
                                onPressed: _saveTag,
                                child: const Text('Save'),
                              )
                            else
                              IconButton(
                                icon: const Icon(Icons.edit, size: 20),
                                onPressed: () => setState(() => _isEditing = true),
                              ),
                            const SizedBox(width: 8),
                            FilledButton.icon(
                              onPressed: _isLoading ? null : _generateAiTag,
                              icon: _isLoading
                                  ? const SizedBox(
                                      width: 16,
                                      height: 16,
                                      child: CircularProgressIndicator(
                                        strokeWidth: 2,
                                        color: Colors.white,
                                      ),
                                    )
                                  : const Icon(Icons.auto_awesome, size: 18),
                              label: const Text('Generate'),
                            ),
                          ],
                        ),
                      ],
                    ),
                  ),
                  // Tag content
                  Expanded(
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      child: _isEditing
                          ? TextField(
                              controller: _tagController,
                              maxLines: null,
                              expands: true,
                              decoration: const InputDecoration(
                                hintText: 'Enter tag or description...',
                                border: OutlineInputBorder(),
                              ),
                            )
                          : SingleChildScrollView(
                              child: Text(
                                _tagController.text.isEmpty
                                    ? 'No tag yet. Tap "Generate" to create an AI tag.'
                                    : _tagController.text,
                                style: TextStyle(
                                  color: _tagController.text.isEmpty
                                      ? Colors.grey
                                      : null,
                                  height: 1.5,
                                ),
                              ),
                            ),
                    ),
                  ),
                  const SizedBox(height: 16),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPreview() {
    final file = File(widget.item.encryptedPath);
    
    if (widget.item.type == MediaType.video) {
      // Video placeholder - actual video player would need video_player package
      return Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          Icon(
            Icons.video_file,
            size: 80,
            color: Colors.grey.withOpacity( 0.5),
          ),
          const SizedBox(height: 16),
          const Text(
            'Video Preview',
            style: TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 8),
          FilledButton.icon(
            onPressed: () {
              // TODO: Implement video playback
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Video playback coming soon')),
              );
            },
            icon: const Icon(Icons.play_arrow),
            label: const Text('Play'),
          ),
        ],
      );
    }

    if (file.existsSync()) {
      return Image.file(
        file,
        fit: BoxFit.contain,
        errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
      );
    }
    
    return _buildPlaceholder();
  }

  Widget _buildPlaceholder() {
    return Column(
      mainAxisAlignment: MainAxisAlignment.center,
      children: [
        Icon(
          Icons.broken_image,
          size: 80,
          color: Colors.grey.withOpacity( 0.5),
        ),
        const SizedBox(height: 16),
        const Text(
          'Unable to load image',
          style: TextStyle(color: Colors.white70),
        ),
      ],
    );
  }
}
