import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { MarketingFooter } from '../../src/components/MarketingFooter';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput } from '../../src/components/ui';
import { createMobileContactApi } from '../../src/lib/contact';
import { DEFAULT_API_BASE_URL } from '../../src/lib/auth';
import { useTheme } from '../../src/theme';

const contactApi = createMobileContactApi(DEFAULT_API_BASE_URL);

export default function ContactScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState('');

  const valid = name.trim().length > 0 && email.trim().includes('@') && message.trim().length >= 10;

  const submit = async () => {
    if (!valid) {
      setError('Fill all fields. Message needs at least 10 characters.');
      return;
    }
    setSending(true);
    setError('');
    try {
      await contactApi.submit({ name: name.trim(), email: email.trim(), message: message.trim() });
      setSent(true);
      setName('');
      setEmail('');
      setMessage('');
    } catch {
      setError('Could not send message. Try again later.');
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen title="Contact Us" subtitle="Have a question? Send us a message.">
      <AppCard>
        <AppInput label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <AppInput label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" autoCapitalize="none" keyboardType="email-address" />
        <AppInput label="Message" value={message} onChangeText={setMessage} placeholder="Write your message (min 10 chars)" multiline numberOfLines={4} />
        <AppButton title={sending ? 'Sending...' : 'Send message'} onPress={submit} disabled={!valid || sending} />
        {sent ? <Text style={[styles.note, { color: colors.success }]}>Message received. We will get back soon.</Text> : null}
        {error ? <Text style={[styles.note, { color: colors.error }]}>{error}</Text> : null}
      </AppCard>
      <MarketingFooter />
    </Screen>
  );
}

const styles = StyleSheet.create({
  note: { fontSize: 13, marginTop: 12, textAlign: 'center' },
});
