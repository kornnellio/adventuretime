'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Editor } from '@tinymce/tinymce-react';
import { z } from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { X, Plus, ImagePlus } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { IBlog } from '@/lib/models/blog';
import { createBlog, updateBlog, getAllTags } from '@/lib/actions/blog';
import { ClientImage } from '@/components/ui/client-image';
import { ImageUpload } from '@/components/ui/image-upload';

const formSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  image: z.string().min(1, 'Featured image is required'),
  author: z.object({
    id: z.string().min(1, 'Author ID is required'),
    name: z.string().min(1, 'Author name is required'),
  }),
  content: z.string().min(10, 'Content must be at least 10 characters'),
  tags: z.array(z.string()),
});

type FormValues = z.infer<typeof formSchema>;

interface BlogFormProps {
  blog?: Partial<IBlog> & { _id?: string };
  currentUser: { id: string; name: string };
  isEditing?: boolean;
}

export default function BlogForm({ blog, currentUser, isEditing = false }: BlogFormProps) {
  const router = useRouter();
  const editorRef = useRef<any>(null);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [availableTags, setAvailableTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [editorKey, setEditorKey] = useState<number>(Date.now());

  // Fetch all existing tags when the component mounts
  useEffect(() => {
    const fetchTags = async () => {
      const response = await getAllTags();
      if (response.success) {
        setAvailableTags(response.data as string[]);
      }
    };
    fetchTags();
  }, []);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: blog?.title || '',
      image: blog?.image || '',
      author: blog?.author || currentUser,
      content: blog?.content || '',
      tags: blog?.tags || [],
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (isEditing && blog?._id) {
        // Update existing blog
        const result = await updateBlog(blog._id, values);
        if (result.success) {
          toast({
            title: 'Blog Updated',
            description: 'Your blog has been updated successfully.',
          });
          router.push('/control-panel/blogs');
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to update blog',
            variant: 'destructive',
          });
        }
      } else {
        // Create new blog
        const result = await createBlog(values);
        if (result.success) {
          toast({
            title: 'Blog Created',
            description: 'Your blog has been created successfully.',
          });
          router.push('/control-panel/blogs');
        } else {
          toast({
            title: 'Error',
            description: result.error || 'Failed to create blog',
            variant: 'destructive',
          });
        }
      }
    } catch (error) {
      console.error('Error saving blog:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addTag = (tag: string) => {
    const currentTags = form.getValues('tags');
    // Only add the tag if it's not already in the array
    if (tag && !currentTags.includes(tag)) {
      form.setValue('tags', [...currentTags, tag]);
      // Add to available tags if it's a new tag
      if (!availableTags.includes(tag)) {
        setAvailableTags([...availableTags, tag]);
      }
      setTagInput('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    const currentTags = form.getValues('tags');
    form.setValue('tags', currentTags.filter(tag => tag !== tagToRemove));
  };

  // Force re-render of editor if there are issues
  const resetEditor = () => {
    setEditorKey(Date.now());
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <div className="grid gap-6">
          <Card>
            <CardContent className="pt-6">
              <div className="space-y-4">
                <FormField
                  control={form.control}
                  name="title"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Title</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter blog title" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="image"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Featured Image</FormLabel>
                      <FormDescription>
                        Upload a featured image for your blog post.
                      </FormDescription>
                      <FormControl>
                        <ImageUpload 
                          values={field.value ? [field.value] : []}
                          onChange={(urls) => {
                            // Take the first image as the featured image
                            if (urls.length > 0) {
                              field.onChange(urls[0]);
                            } else {
                              field.onChange('');
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="content"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content</FormLabel>
                      <FormDescription>
                        Write your blog post content using the editor below.
                      </FormDescription>
                      <FormControl>
                        <Editor
                          key={editorKey}
                          onInit={(evt, editor) => {
                            editorRef.current = editor;
                            // Focus the editor after initialization
                            setTimeout(() => {
                              editor.focus();
                            }, 100);
                          }}
                          initialValue={field.value}
                          tinymceScriptSrc="/tinymce/tinymce.min.js"
                          init={{
                            height: 500,
                            menubar: true,
                            plugins: [
                              'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                              'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                              'insertdatetime', 'media', 'table', 'help', 'wordcount',
                              'emoticons', 'importcss', 'autosave', 'directionality',
                              'nonbreaking', 'pagebreak', 'quickbars', 'save'
                            ],
                            toolbar:
                              'undo redo | blocks | ' +
                              'bold italic forecolor backcolor | alignleft aligncenter ' +
                              'alignright alignjustify | bullist numlist outdent indent | ' +
                              'removeformat | image media table link | fullscreen code | help',
                            content_style: "body { font-family: Inter, sans-serif; font-size: 16px; direction: ltr; }",
                            branding: false,
                            base_url: '/tinymce',
                            image_advtab: true,
                            file_picker_types: 'image',
                            automatic_uploads: true,
                            images_reuse_filename: true,
                            images_upload_handler: async (blobInfo: any) => {
                              const formData = new FormData();
                              formData.append('file', blobInfo.blob(), blobInfo.filename());

                              const response = await fetch('/api/upload', {
                                method: 'POST',
                                body: formData,
                              });

                              if (!response.ok) {
                                throw new Error('Upload failed');
                              }

                              const data = await response.json();
                              return data.location || data.url;
                            },
                            directionality: 'ltr',
                            setup: (editor) => {
                              // Use a custom object to store selection state
                              const editorState: any = {};
                              
                              // Store selection before content change
                              editor.on('BeforeSetContent', () => {
                                if (editor.selection) {
                                  editorState.bookmark = editor.selection.getBookmark(2, true);
                                }
                              });
                              
                              // Restore selection after content change
                              editor.on('SetContent', () => {
                                if (editor.selection && editorState.bookmark) {
                                  editor.selection.moveToBookmark(editorState.bookmark);
                                  editorState.bookmark = null;
                                }
                              });
                            },
                            forced_root_block: 'p',
                            forced_root_block_attrs: {
                              'class': 'mce-content-body'
                            },
                            entity_encoding: 'raw',
                            keep_styles: true,
                            cache_suffix: '?v=' + editorKey,
                            newline_behavior: 'block',
                            text_patterns: [
                              { start: '*', end: '*', format: 'italic' },
                              { start: '**', end: '**', format: 'bold' },
                              { start: '#', format: 'h1' },
                              { start: '##', format: 'h2' },
                              { start: '###', format: 'h3' },
                              { start: '####', format: 'h4' },
                              { start: '#####', format: 'h5' },
                              { start: '######', format: 'h6' },
                              { start: '1. ', cmd: 'InsertOrderedList' },
                              { start: '* ', cmd: 'InsertUnorderedList' },
                              { start: '- ', cmd: 'InsertUnorderedList' }
                            ]
                          }}
                          onEditorChange={(content) => {
                            field.onChange(content);
                          }}
                          onPaste={(e, editor) => {
                            // Let TinyMCE handle the paste event normally
                            return true;
                          }}
                        />
                      </FormControl>
                      <div className="mt-2 flex justify-end">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={resetEditor}
                        >
                          Reset Editor
                        </Button>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="tags"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Etichete</FormLabel>
                      <FormDescription>
                        Adaugă etichete pentru a categoriza articolul de blog
                      </FormDescription>
                      <div className="flex gap-2">
                        <FormControl>
                          <Input 
                            value={tagInput} 
                            onChange={(e) => setTagInput(e.target.value)} 
                            placeholder="Adaugă o etichetă"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.preventDefault();
                                addTag(tagInput);
                              }
                            }}
                          />
                        </FormControl>
                        <Button type="button" size="sm" onClick={() => addTag(tagInput)}>
                          <Plus className="h-4 w-4 mr-2" />
                          Adaugă
                        </Button>
                      </div>
                      
                      {/* Display existing tags */}
                      <div className="flex flex-wrap gap-2 mt-2">
                        {field.value.map((tag, index) => (
                          <Badge key={index} variant="secondary" className="text-sm py-1">
                            {tag}
                            <button 
                              type="button" 
                              onClick={() => removeTag(tag)}
                              className="ml-1 rounded-full hover:bg-accent p-1"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </Badge>
                        ))}
                      </div>
                      
                      {/* Display suggested tags */}
                      {availableTags.length > 0 && (
                        <div className="mt-4">
                          <p className="text-sm text-muted-foreground mb-1">Etichete sugerate:</p>
                          <div className="flex flex-wrap gap-2">
                            {availableTags
                              .filter(tag => !field.value.includes(tag))
                              .map((tag, index) => (
                                <Badge 
                                  key={index} 
                                  variant="outline"
                                  className="cursor-pointer hover:bg-accent"
                                  onClick={() => addTag(tag)}
                                >
                                  {tag}
                                </Badge>
                              ))
                            }
                          </div>
                        </div>
                      )}
                      
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push('/control-panel/blogs')}
          >
            Anulează
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting 
              ? 'Se salvează...' 
              : isEditing
                ? 'Actualizează Blog'
                : 'Creează Blog'
            }
          </Button>
        </div>
      </form>
    </Form>
  );
} 
