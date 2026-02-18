/**
 * Help Center Screen
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  TextInput,
  Alert,
} from 'react-native';
import Card from '../../components/Card';
import Button from '../../components/Button';
import Icon from '../../components/Icon';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';

interface FAQItem {
  question: string;
  answer: string;
}

export default function HelpCenterScreen({ navigation }: any) {
  const [expandedFAQ, setExpandedFAQ] = useState<number | null>(null);
  const [supportMessage, setSupportMessage] = useState('');

  const faqs: FAQItem[] = [
    {
      question: 'How do I book a property?',
      answer: 'Browse properties, select dates and guest count, then click "Request to Book" or "Book Now". For instant booking properties, you can book immediately. For others, the host will need to approve your request.',
    },
    {
      question: 'What is instant booking?',
      answer: 'Instant booking allows you to book a property immediately without waiting for host approval. Properties with instant booking enabled can be booked instantly by clicking the "Book Now" button.',
    },
    {
      question: 'How do I cancel a booking?',
      answer: 'Go to "My Bookings", select the booking you want to cancel, and tap the "Cancel Booking" button. Cancellation policies vary by property, so please review the policy before canceling.',
    },
    {
      question: 'How do I contact the host?',
      answer: 'After making a booking request or booking a property, you can message the host directly through the chat feature in the Messages tab.',
    },
    {
      question: 'What payment methods are accepted?',
      answer: 'We accept payments through SSLCommerz, which supports credit cards, debit cards, mobile banking (bKash, Nagad, Rocket), and internet banking.',
    },
    {
      question: 'How do I become a host?',
      answer: 'Contact our support team to upgrade your account to a host account. Once approved, you can list your properties and start earning!',
    },
    {
      question: 'How do I add a property as a host?',
      answer: 'Go to the Host Dashboard, tap "Add New Listing", fill in the property details, upload photos, and submit. Your listing will be reviewed before going live.',
    },
    {
      question: 'How do refunds work?',
      answer: 'Refund policies depend on the property cancellation policy and when you cancel. Full refunds are typically provided for cancellations made well in advance. Contact support for specific refund inquiries.',
    },
  ];

  const toggleFAQ = (index: number) => {
    setExpandedFAQ(expandedFAQ === index ? null : index);
  };

  const handleContactSupport = () => {
    if (!supportMessage.trim()) {
      Alert.alert('Error', 'Please enter your message');
      return;
    }
    Alert.alert(
      'Message Sent',
      'Our support team will get back to you within 24 hours.',
      [{ text: 'OK', onPress: () => setSupportMessage('') }]
    );
  };

  const ContactButton = ({
    iconName,
    title,
    subtitle,
    onPress,
  }: {
    iconName: string;
    title: string;
    subtitle: string;
    onPress: () => void;
  }) => (
    <TouchableOpacity style={styles.contactButton} onPress={onPress}>
      <View style={styles.contactIcon}>
        <Icon name={iconName} size={20} color={Colors.brand} />
      </View>
      <View style={styles.contactContent}>
        <Text style={styles.contactTitle}>{title}</Text>
        <Text style={styles.contactSubtitle}>{subtitle}</Text>
      </View>
      <Icon name="chevron-forward-outline" size={18} color={Colors.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Quick Contact */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Contact Us</Text>
        <ContactButton
          iconName="mail-outline"
          title="Email Support"
          subtitle="support@gowaay.com"
          onPress={() => Linking.openURL('mailto:support@gowaay.com')}
        />
        <ContactButton
          iconName="call-outline"
          title="Call Us"
          subtitle="01611-553628"
          onPress={() => {
            Linking.openURL('tel:+8801611553628').catch(err => {
              Alert.alert('Error', 'Unable to make phone call');
              console.error('Error opening phone dialer:', err);
            });
          }}
        />
        <ContactButton
          iconName="chatbubble-ellipses-outline"
          title="Live Chat"
          subtitle="Chat with our support team on WhatsApp"
          onPress={() => {
            // Open WhatsApp with the number
            const whatsappUrl = 'whatsapp://send?phone=8801611553628';
            const whatsappWebUrl = 'https://wa.me/8801611553628';
            
            Linking.canOpenURL(whatsappUrl)
              .then((supported) => {
                if (supported) {
                  return Linking.openURL(whatsappUrl);
                } else {
                  // If WhatsApp app is not installed, open web version
                  return Linking.openURL(whatsappWebUrl);
                }
              })
              .catch((err) => {
                Alert.alert('Error', 'Unable to open WhatsApp');
                console.error('Error opening WhatsApp:', err);
              });
          }}
        />
      </Card>

      {/* FAQs */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>
        {faqs.map((faq, index) => (
          <View key={index}>
            <TouchableOpacity
              style={styles.faqItem}
              onPress={() => toggleFAQ(index)}
            >
              <Text style={styles.faqQuestion}>{faq.question}</Text>
              <Icon
                name={expandedFAQ === index ? 'chevron-down-outline' : 'chevron-forward-outline'}
                size={16}
                color={Colors.textTertiary}
              />
            </TouchableOpacity>
            {expandedFAQ === index && (
              <View style={styles.faqAnswer}>
                <Text style={styles.faqAnswerText}>{faq.answer}</Text>
              </View>
            )}
          </View>
        ))}
      </Card>

      {/* Support Form */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Send us a message</Text>
        <Text style={styles.formLabel}>
          Can't find what you're looking for? Send us a message and we'll get back to you.
        </Text>
        <TextInput
          style={styles.messageInput}
          value={supportMessage}
          onChangeText={setSupportMessage}
          placeholder="Describe your issue or question..."
          placeholderTextColor={Colors.textTertiary}
          multiline
          numberOfLines={5}
          textAlignVertical="top"
        />
        <Button
          title="Send Message"
          onPress={handleContactSupport}
          fullWidth
        />
      </Card>

      {/* Resources */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Resources</Text>
        <ContactButton
          iconName="book-outline"
          title="User Guide"
          subtitle="Learn how to use GoWaay"
          onPress={() => Alert.alert('Coming Soon', 'User guide will be available soon')}
        />
        <ContactButton
          iconName="videocam-outline"
          title="Video Tutorials"
          subtitle="Watch helpful tutorial videos"
          onPress={() => Alert.alert('Coming Soon', 'Video tutorials will be available soon')}
        />
        <ContactButton
          iconName="newspaper-outline"
          title="Blog & Updates"
          subtitle="Latest news and updates"
          onPress={() => Alert.alert('Coming Soon', 'Blog will be available soon')}
        />
      </Card>

      <View style={{ height: Theme.spacing.xl }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F4F8',
  },
  card: {
    margin: 16,
    marginBottom: 0,
    backgroundColor: Colors.white,
    borderRadius: 17,
    borderWidth: 1,
    borderColor: Colors.gray100,
    padding: 14,
    ...Theme.shadows.sm,
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: Colors.textTertiary,
    marginBottom: 14,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  contactIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.gray100,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  contactIconText: {},
  contactContent: {
    flex: 1,
  },
  contactTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  contactSubtitle: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  contactArrow: {},
  faqItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  faqQuestion: {
    flex: 1,
    fontSize: 15,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
    marginRight: 14,
    letterSpacing: -0.2,
  },
  faqIcon: {},
  faqAnswer: {
    paddingHorizontal: 14,
    paddingBottom: 14,
    backgroundColor: Colors.gray100,
    borderRadius: Theme.borderRadius.md,
    marginBottom: Theme.spacing.sm,
  },
  faqAnswerText: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  formLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    marginBottom: 14,
    lineHeight: 20,
  },
  messageInput: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.gray100,
    borderRadius: Theme.borderRadius.md,
    padding: 14,
    fontSize: 13,
    color: Colors.textPrimary,
    marginBottom: 14,
    minHeight: 120,
  },
});
