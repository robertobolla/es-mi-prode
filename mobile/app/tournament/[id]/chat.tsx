import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, FlatList, KeyboardAvoidingView, Platform, ActivityIndicator, Image } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
// Bypass Metro resolution bug by importing pre-bundled JS
// @ts-ignore
import io, { Socket } from 'socket.io-client/dist/socket.io.js';
import { api, API_URL } from '../../../lib/api';
import { supabase } from '../../../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import { Video, ResizeMode } from 'expo-av';
import { decode } from 'base64-arraybuffer';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

export default function TournamentChatScreen() {
  const { id } = useLocalSearchParams();
  const [user, setUser] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [historyResponse, userResponse] = await Promise.all([
        api.get(`/tournaments/${id}/chat`),
        api.get('/users/me'),
      ]);
      setMessages(historyResponse);
      setUser(userResponse);
      setupSocket(userResponse.id);
    } catch (e) {
      console.log('Error fetching chat data', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    return () => {
      if (socket) {
        socket.emit('leaveTournamentChat', { tournamentId: id });
        socket.disconnect();
      }
    };
  }, [socket]);

  const setupSocket = (userId: string) => {
    // Determine the base URL for WebSockets (removing /api if present)
    const baseUrl = API_URL.replace(/\/api$/, '');
    const newSocket = io(baseUrl);

    newSocket.on('connect', () => {
      console.log('Socket connected', newSocket.id);
      newSocket.emit('joinTournamentChat', { tournamentId: id, userId: user?.id });
    });

    newSocket.on('newMessage', (msg: any) => {
      setMessages((prev) => [...prev, msg]);
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    });

    setSocket(newSocket);
  };

  const sendMessage = (content = '', mediaUrl?: string, mediaType?: string) => {
    const text = content || inputText.trim();
    if ((!text && !mediaUrl) || !socket) return;

    socket.emit('sendMessage', {
      tournamentId: id,
      userId: user?.id,
      content: text,
      mediaUrl,
      mediaType,
    });

    if (!content) setInputText('');
  };

  const pickMedia = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 0.7,
        base64: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      await handleUpload(result.assets[0]);
    } catch (error) {
      console.log('Error picking media:', error);
      alert('Error al acceder a la galería');
    }
  };

  const handleUpload = async (asset: ImagePicker.ImagePickerAsset) => {
    setUploading(true);
    try {
      const isVideo = asset.type === 'video';
      const uriExt = asset.uri.split('.').pop()?.toLowerCase();
      const fallbackExt = isVideo ? 'mp4' : 'jpg';
      const fileExt = uriExt && uriExt.length <= 4 ? uriExt : fallbackExt;
      
      const fileName = `chat/${id}/${Date.now()}.${fileExt}`;
      const defaultMime = isVideo ? `video/${fileExt}` : `image/jpeg`;
      const contentType = asset.mimeType || defaultMime;

      let fileBody;
      let uploadOptions: any = { upsert: true };
      
      if (asset.base64 && !isVideo) {
        // Use base64 if present from ImagePicker
        fileBody = decode(asset.base64);
        uploadOptions.contentType = contentType;
      } else {
        // For large videos, use FormData native React Native fetch mechanism
        const formData = new FormData();
        formData.append('file', {
          uri: asset.uri,
          name: fileName,
          type: contentType,
        } as any);
        fileBody = formData;
        // Do not set contentType when passing FormData to allow auto-generation of boundary
      }

      const { error } = await supabase.storage
        .from('avatars')
        .upload(fileName, fileBody, uploadOptions);

      if (error) {
        console.error('Supabase upload err:', error);
        throw error;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);

      sendMessage('', publicUrl, isVideo ? 'video' : 'image');
    } catch (e: any) {
      console.error('Upload error:', e);
      if (e.message && e.message.includes('exceeded the maximum allowed size')) {
        alert('El archivo es demasiado grande para el límite configurado en Supabase. Intentá con uno más corto o aumentá el límite en el panel de Supabase.');
      } else {
        alert('Error al subir el archivo. Intenta con una imagen más liviana.');
      }
    } finally {
      setUploading(false);
    }
  };

  const renderMessage = ({ item }: { item: any }) => {
    const isMe = item.userId === user?.id;

    return (
      <View style={[styles.messageWrapper, isMe ? styles.messageWrapperMe : styles.messageWrapperOther]}>
        {!isMe && (
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.user?.username?.charAt(0).toUpperCase() || '?'}</Text>
          </View>
        )}
        <View style={[styles.messageBubble, isMe ? styles.messageBubbleMe : styles.messageBubbleOther]}>
          {!isMe && <Text style={styles.messageSender}>{item.user?.username}</Text>}
          
          {item.mediaUrl && item.mediaType === 'image' && (
            <Image source={{ uri: item.mediaUrl }} style={styles.messageImage} />
          )}

          {item.mediaUrl && item.mediaType === 'video' && (
            <Video
              style={styles.messageVideo}
              source={{ uri: item.mediaUrl }}
              useNativeControls
              resizeMode={ResizeMode.CONTAIN}
              isLooping={false}
            />
          )}

          {item.content ? <Text style={styles.messageText}>{item.content}</Text> : null}
          
          <Text style={styles.messageTime}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <LinearGradient colors={['#0F172A', '#020617']} style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#F8FAFC" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sala de Charla</Text>
      </LinearGradient>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#EAB308" />
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
        />
      )}

      <View style={styles.inputContainer}>
        <TouchableOpacity style={styles.attachBtn} onPress={pickMedia} disabled={uploading}>
          {uploading ? (
            <ActivityIndicator size="small" color="#EAB308" />
          ) : (
            <Ionicons name="image-outline" size={24} color="#94A3B8" />
          )}
        </TouchableOpacity>
        
        <TextInput
          style={styles.input}
          placeholder="Escribí un mensaje..."
          placeholderTextColor="#64748B"
          value={inputText}
          onChangeText={setInputText}
          multiline
        />
        <TouchableOpacity 
          style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDisabled]} 
          onPress={() => sendMessage()}
          disabled={!inputText.trim()}
        >
          <Ionicons name="send" size={20} color={inputText.trim() ? '#422006' : '#94A3B8'} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#F8FAFC',
    letterSpacing: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  messageWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 8,
  },
  messageWrapperMe: {
    justifyContent: 'flex-end',
  },
  messageWrapperOther: {
    justifyContent: 'flex-start',
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(234, 179, 8, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  avatarText: {
    color: '#EAB308',
    fontWeight: 'bold',
    fontSize: 14,
  },
  messageBubble: {
    maxWidth: '80%',
    padding: 12,
    borderRadius: 20,
  },
  messageBubbleMe: {
    backgroundColor: 'rgba(234, 179, 8, 0.9)',
    borderBottomRightRadius: 4,
  },
  messageBubbleOther: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#EAB308',
    marginBottom: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#F8FAFC',
    marginTop: 2,
  },
  messageImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  messageVideo: {
    width: 220,
    height: 300,
    borderRadius: 12,
    marginBottom: 6,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  messageTime: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    alignSelf: 'flex-end',
    marginTop: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 16,
    paddingBottom: 32,
    backgroundColor: '#0F172A',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
    alignItems: 'flex-end',
    gap: 12,
  },
  attachBtn: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  input: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    color: '#F8FAFC',
    maxHeight: 100,
    minHeight: 44,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#EAB308',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendBtnDisabled: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
});
