import 'dart:io';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:image_picker/image_picker.dart';
import '../providers/app_state.dart';
import '../models/category.dart';
import '../models/media_item.dart';
import 'image_view_screen.dart';

class CategoryDetailScreen extends StatefulWidget {
  final Category category;

  const CategoryDetailScreen({super.key, required this.category});

  @override
  State<CategoryDetailScreen> createState() => _CategoryDetailScreenState();
}

class _CategoryDetailScreenState extends State<CategoryDetailScreen> {
  final ImagePicker _picker = ImagePicker();
  bool _isSelectionMode = false;
  final Set<String> _selectedItems = {};

  void _toggleSelectionMode() {
    setState(() {
      _isSelectionMode = !_isSelectionMode;
      if (!_isSelectionMode) {
        _selectedItems.clear();
      }
    });
  }

  void _toggleItemSelection(String itemId) {
    setState(() {
      if (_selectedItems.contains(itemId)) {
        _selectedItems.remove(itemId);
      } else {
        _selectedItems.add(itemId);
      }
    });
  }

  Future<void> _importMedia() async {
    showModalBottomSheet(
      context: context,
      builder: (context) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Import Images'),
              onTap: () {
                Navigator.pop(context);
                _pickImages();
              },
            ),
            ListTile(
              leading: const Icon(Icons.video_library),
              title: const Text('Import Videos'),
              onTap: () {
                Navigator.pop(context);
                _pickVideos();
              },
            ),
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Take Photo'),
              onTap: () {
                Navigator.pop(context);
                _takePhoto();
              },
            ),
          ],
        ),
      ),
    );
  }

  Future<void> _pickImages() async {
    try {
      final List<XFile> images = await _picker.pickMultiImage();
      if (images.isNotEmpty) {
        for (final image in images) {
          await _addMediaItem(image.path, MediaType.image);
        }
      }
    } catch (e) {
      _showError('Failed to pick images: $e');
    }
  }

  Future<void> _pickVideos() async {
    try {
      final XFile? video = await _picker.pickVideo(source: ImageSource.gallery);
      if (video != null) {
        await _addMediaItem(video.path, MediaType.video);
      }
    } catch (e) {
      _showError('Failed to pick video: $e');
    }
  }

  Future<void> _takePhoto() async {
    try {
      final XFile? photo = await _picker.pickImage(source: ImageSource.camera);
      if (photo != null) {
        await _addMediaItem(photo.path, MediaType.image);
      }
    } catch (e) {
      _showError('Failed to take photo: $e');
    }
  }

  Future<void> _addMediaItem(String sourcePath, MediaType type) async {
    final appState = context.read<AppState>();
    // TODO: Copy file to app's private directory and encrypt
    // For now, just store the original path
    await appState.addMediaItem(
      categoryId: widget.category.id,
      originalPath: sourcePath,
      encryptedPath: sourcePath, // Will be replaced with encrypted path
      type: type,
    );
  }

  void _showError(String message) {
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(content: Text(message), backgroundColor: Colors.red),
    );
  }

  void _deleteSelectedItems() {
    showDialog(
      context: context,
      builder: (context) => AlertDialog(
        title: const Text('Delete Items'),
        content: Text('Delete ${_selectedItems.length} selected items?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(context),
            child: const Text('Cancel'),
          ),
          FilledButton(
            style: FilledButton.styleFrom(backgroundColor: Colors.red),
            onPressed: () {
              final appState = context.read<AppState>();
              for (final id in _selectedItems) {
                appState.deleteMediaItem(id);
              }
              Navigator.pop(context);
              _toggleSelectionMode();
            },
            child: const Text('Delete'),
          ),
        ],
      ),
    );
  }

  void _aiTagSelectedItems() {
    // TODO: Implement AI tagging
    ScaffoldMessenger.of(context).showSnackBar(
      SnackBar(
        content: Text('AI tagging ${_selectedItems.length} items...'),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    return Consumer<AppState>(
      builder: (context, appState, child) {
        final items = appState.getMediaItemsByCategory(widget.category.id);

        return Scaffold(
          appBar: AppBar(
            title: Text(widget.category.name),
            actions: [
              if (_isSelectionMode) ...[
                IconButton(
                  icon: const Icon(Icons.auto_awesome),
                  tooltip: 'AI Tag',
                  onPressed: _selectedItems.isNotEmpty ? _aiTagSelectedItems : null,
                ),
                IconButton(
                  icon: const Icon(Icons.delete),
                  tooltip: 'Delete',
                  onPressed: _selectedItems.isNotEmpty ? _deleteSelectedItems : null,
                ),
                IconButton(
                  icon: const Icon(Icons.close),
                  onPressed: _toggleSelectionMode,
                ),
              ] else ...[
                IconButton(
                  icon: const Icon(Icons.checklist),
                  tooltip: 'Select',
                  onPressed: items.isNotEmpty ? _toggleSelectionMode : null,
                ),
              ],
            ],
          ),
          body: items.isEmpty
              ? Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(
                        Icons.photo_library_outlined,
                        size: 80,
                        color: Colors.grey.withValues(alpha: 0.5),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'No items yet',
                        style: TextStyle(
                          fontSize: 18,
                          color: Colors.grey.withValues(alpha: 0.7),
                        ),
                      ),
                      const SizedBox(height: 8),
                      Text(
                        'Tap + to import images or videos',
                        style: TextStyle(
                          color: Colors.grey.withValues(alpha: 0.5),
                        ),
                      ),
                    ],
                  ),
                )
              : GridView.builder(
                  padding: const EdgeInsets.all(8),
                  gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                    crossAxisCount: 3,
                    crossAxisSpacing: 4,
                    mainAxisSpacing: 4,
                  ),
                  itemCount: items.length,
                  itemBuilder: (context, index) {
                    final item = items[index];
                    final isSelected = _selectedItems.contains(item.id);
                    return _MediaThumbnail(
                      item: item,
                      isSelected: isSelected,
                      isSelectionMode: _isSelectionMode,
                      onTap: () {
                        if (_isSelectionMode) {
                          _toggleItemSelection(item.id);
                        } else {
                          Navigator.push(
                            context,
                            MaterialPageRoute(
                              builder: (_) => ImageViewScreen(item: item),
                            ),
                          );
                        }
                      },
                      onLongPress: () {
                        if (!_isSelectionMode) {
                          _toggleSelectionMode();
                          _toggleItemSelection(item.id);
                        }
                      },
                    );
                  },
                ),
          floatingActionButton: _isSelectionMode
              ? null
              : FloatingActionButton(
                  onPressed: _importMedia,
                  child: const Icon(Icons.add),
                ),
        );
      },
    );
  }
}

class _MediaThumbnail extends StatelessWidget {
  final MediaItem item;
  final bool isSelected;
  final bool isSelectionMode;
  final VoidCallback onTap;
  final VoidCallback onLongPress;

  const _MediaThumbnail({
    required this.item,
    required this.isSelected,
    required this.isSelectionMode,
    required this.onTap,
    required this.onLongPress,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      onLongPress: onLongPress,
      child: Stack(
        fit: StackFit.expand,
        children: [
          // Thumbnail
          Container(
            decoration: BoxDecoration(
              color: Theme.of(context).colorScheme.surfaceContainerHighest,
              border: isSelected
                  ? Border.all(
                      color: Theme.of(context).colorScheme.primary,
                      width: 3,
                    )
                  : null,
            ),
            child: _buildThumbnail(),
          ),
          // Resolution badge
          Positioned(
            left: 4,
            bottom: 4,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 2),
              decoration: BoxDecoration(
                color: Colors.black.withValues(alpha: 0.7),
                borderRadius: BorderRadius.circular(4),
              ),
              child: Text(
                '${item.width}x${item.height}',
                style: const TextStyle(
                  color: Colors.white,
                  fontSize: 10,
                ),
              ),
            ),
          ),
          // Video indicator
          if (item.type == MediaType.video)
            Positioned(
              right: 4,
              bottom: 4,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.black.withValues(alpha: 0.7),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.play_arrow,
                  color: Colors.white,
                  size: 16,
                ),
              ),
            ),
          // Tag indicator
          if (item.aiTag != null && item.aiTag!.isNotEmpty)
            Positioned(
              right: 4,
              top: 4,
              child: Container(
                padding: const EdgeInsets.all(4),
                decoration: BoxDecoration(
                  color: Colors.green.withValues(alpha: 0.8),
                  shape: BoxShape.circle,
                ),
                child: const Icon(
                  Icons.check,
                  color: Colors.white,
                  size: 12,
                ),
              ),
            ),
          // Selection checkbox
          if (isSelectionMode)
            Positioned(
              left: 4,
              top: 4,
              child: Container(
                decoration: BoxDecoration(
                  color: isSelected
                      ? Theme.of(context).colorScheme.primary
                      : Colors.black.withValues(alpha: 0.5),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  isSelected ? Icons.check_circle : Icons.circle_outlined,
                  color: Colors.white,
                  size: 24,
                ),
              ),
            ),
        ],
      ),
    );
  }

  Widget _buildThumbnail() {
    // Check if file exists
    final file = File(item.encryptedPath);
    if (file.existsSync() && item.type == MediaType.image) {
      return Image.file(
        file,
        fit: BoxFit.cover,
        errorBuilder: (context, error, stackTrace) => _buildPlaceholder(),
      );
    }
    return _buildPlaceholder();
  }

  Widget _buildPlaceholder() {
    return Center(
      child: Icon(
        item.type == MediaType.video ? Icons.video_file : Icons.image,
        size: 32,
        color: Colors.grey,
      ),
    );
  }
}
