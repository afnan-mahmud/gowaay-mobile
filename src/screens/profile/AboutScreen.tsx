/**
 * About Screen
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Linking,
  Image,
} from 'react-native';
import Card from '../../components/Card';
import Icon from '../../components/Icon';
import { Theme } from '../../constants/theme';
import { Colors } from '../../constants/colors';


export default function AboutScreen({ navigation }: any) {
  const handleOpenURL = (url: string) => {
    Linking.openURL(url).catch(() => {
      console.error('Failed to open URL:', url);
    });
  };

  const SocialButton = ({
    iconName,
    title,
    url,
  }: {
    iconName: string;
    title: string;
    url: string;
  }) => (
    <TouchableOpacity
      style={styles.socialButton}
      onPress={() => handleOpenURL(url)}
    >
      <Icon name={iconName} size={20} color={Colors.brand} style={styles.socialIcon} />
      <Text style={styles.socialTitle}>{title}</Text>
    </TouchableOpacity>
  );

  const InfoRow = ({ label, value }: { label: string; value: string }) => (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );

  return (
    <ScrollView style={styles.container}>
      {/* Logo & Title */}
      <Card style={styles.card}>
        <View style={styles.logoContainer}>
          <View style={styles.logo}>
            <Image 
                source={require('../../assets/images/logo.png')} 
                style={{ width: 72, height: 72 }} 
                resizeMode="contain"
              />
          </View>
          <Text style={styles.tagline}>Your Perfect Stay Awaits</Text>
        </View>
      </Card>

      {/* About Us */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>About GoWaay</Text>
        <Text style={styles.description}>
          GoWaay is Bangladesh's premier property rental marketplace, connecting guests with unique accommodations across the country. Whether you're looking for a cozy apartment in Dhaka, a beachside villa in Cox's Bazar, or a serene retreat in Sylhet, we've got you covered.
        </Text>
        <Text style={styles.description}>
          Our platform makes it easy for guests to find and book their perfect stay, while empowering hosts to share their properties and earn income.
        </Text>
      </Card>

      {/* Mission & Vision */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Our Mission</Text>
        <Text style={styles.description}>
          To revolutionize the hospitality industry in Bangladesh by providing a safe, reliable, and user-friendly platform that brings guests and hosts together.
        </Text>
      </Card>

      {/* Features */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Why Choose Us?</Text>
        <View style={styles.featureList}>
          {[
            'Verified Properties & Hosts',
            'Secure Payment Processing',
            '24/7 Customer Support',
            'Instant Booking Available',
            'Easy Cancellation',
            'Real-time Messaging',
          ].map((text, i) => (
            <View key={i} style={styles.featureItem}>
              <Icon name="checkmark-circle" size={18} color={Colors.success} style={styles.featureIcon} />
              <Text style={styles.featureText}>{text}</Text>
            </View>
          ))}
        </View>
      </Card>

      {/* App Info */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>App Information</Text>
        <InfoRow label="Version" value="1.0.0" />
        <InfoRow label="Released" value="January 2026" />
        <InfoRow label="Platform" value="iOS & Android" />
        <InfoRow label="Developer" value="GoWaay Team" />
      </Card>

      {/* Social Media */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Follow Us</Text>
        <View style={styles.socialContainer}>
          <SocialButton
            iconName="logo-facebook"
            title="Facebook"
            url="https://facebook.com/gowaay.official"
          />
          <SocialButton
            iconName="logo-instagram"
            title="Instagram"
            url="https://instagram.com/gowaay.official/"
          />
        </View>
      </Card>

      {/* Legal */}
      <Card style={styles.card}>
        <Text style={styles.sectionTitle}>Legal</Text>
        <TouchableOpacity
          style={styles.legalButton}
          onPress={() => navigation.navigate('PrivacyPolicy')}
        >
          <Text style={styles.legalButtonText}>Privacy Policy</Text>
          <Icon name="chevron-forward-outline" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.legalButton}
          onPress={() => navigation.navigate('TermsOfService')}
        >
          <Text style={styles.legalButtonText}>Terms of Service</Text>
          <Icon name="chevron-forward-outline" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.legalButton}
          onPress={() => navigation.navigate('RefundPolicy')}
        >
          <Text style={styles.legalButtonText}>Refund Policy</Text>
          <Icon name="chevron-forward-outline" size={20} color={Colors.textTertiary} />
        </TouchableOpacity>
      </Card>

      {/* Copyright */}
      <View style={styles.copyright}>
        <Text style={styles.copyrightText}>
          © 2026 GoWaay. All rights reserved.
        </Text>
        <Text style={styles.copyrightText}>Made with love in Bangladesh</Text>
      </View>

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
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  logo: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.brand,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  logoText: {},
  appName: {
    fontSize: 28,
    fontWeight: Theme.fontWeight.bold,
    color: Colors.textPrimary,
    marginBottom: Theme.spacing.xs,
    letterSpacing: -0.2,
  },
  tagline: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontStyle: 'italic',
  },
  sectionTitle: {
    fontSize: 12,
    letterSpacing: 0.8,
    textTransform: 'uppercase' as const,
    color: Colors.textTertiary,
    marginBottom: 14,
  },
  description: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 22,
    marginBottom: 14,
  },
  featureList: {
    gap: Theme.spacing.sm,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    marginRight: Theme.spacing.sm,
  },
  featureText: {
    fontSize: 13,
    color: Colors.textSecondary,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  infoLabel: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
  },
  socialContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 14,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gray100,
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 20,
    minWidth: '45%',
  },
  socialIcon: {
    marginRight: Theme.spacing.xs,
  },
  socialTitle: {
    fontSize: 15,
    fontWeight: Theme.fontWeight.medium,
    color: Colors.textPrimary,
    letterSpacing: -0.2,
  },
  legalButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.gray100,
  },
  legalButtonText: {
    fontSize: 15,
    color: Colors.brand,
    fontWeight: Theme.fontWeight.medium,
  },
  copyright: {
    alignItems: 'center',
    paddingVertical: 16,
    marginTop: 16,
  },
  copyrightText: {
    fontSize: 12,
    color: Colors.textTertiary,
    marginBottom: Theme.spacing.xs,
  },
});
