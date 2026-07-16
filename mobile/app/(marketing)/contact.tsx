import { useState } from 'react';
import { StyleSheet, Text } from 'react-native';
import { Screen } from '../../src/components/Screen';
import { AppButton, AppCard, AppInput } from '../../src/components/ui';
import { useTheme } from '../../src/theme';

export default function ContactScreen() {
  const { colors } = useTheme();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const submit = () => {
    if (!name.trim() || !email.trim() || !message.trim()) return;
    setSent(true);
    setName('');
    setEmail('');
    setMessage('');
  };

  return (
    <Screen title="Contact Us" subtitle="Have a question? Send us a message.">
      <AppCard>
        <AppInput label="Name" value={name} onChangeText={setName} placeholder="Your name" />
        <AppInput label="Email" value={email} onChangeText={setEmail} placeholder="you@company.com" autoCapitalize="none" keyboardType="email-address" />
        <AppInput label="Message" value={message} onChangeText={setMessage} placeholder="Write your message" multiline numberOfLines={4} />
        <AppButton title="Send message" onPress={submit} disabled={!name.trim() || !email.trim() || !message.trim()} />
        {sent ? <Text style={[styles.sent, { color: colors.success }]}>Message sent. We will get back soon.</Text> : null}
      </AppCard>
    </Screen>
  );
}

const styles = StyleSheet.create({
  sent: { fontSize: 13, marginTop: 12, textAlign: 'center' },
});
