import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { apiService } from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { RefreshCw, Save } from "lucide-react";

type PaymentSettings = {
  _id: string;
  cod_enabled: boolean;
  mobile_payment_enabled: boolean;
  account_title: string;
  account_number: string;
  iban: string;
  bank_name: string;
  instructions: string;
  contact_email: string;
  contact_whatsapp: string;
};

const DEFAULT_SETTINGS: PaymentSettings = {
  _id: '',
  cod_enabled: true,
  mobile_payment_enabled: true,
  account_title: 'Phresh Juices',
  account_number: '1234567890',
  iban: 'PK36SCBL0000001123456702',
  bank_name: 'Standard Chartered',
  instructions: 'Please use your order number as reference',
  contact_email: 'support@phresh.pk',
  contact_whatsapp: '+923020025727',
};

export const PaymentOptionsManagement = () => {
  const [settings, setSettings] = useState<PaymentSettings | null>(null);
  const [form, setForm] = useState({
    cod_enabled: DEFAULT_SETTINGS.cod_enabled,
    mobile_payment_enabled: DEFAULT_SETTINGS.mobile_payment_enabled,
    account_title: DEFAULT_SETTINGS.account_title,
    account_number: DEFAULT_SETTINGS.account_number,
    iban: DEFAULT_SETTINGS.iban,
    bank_name: DEFAULT_SETTINGS.bank_name,
    instructions: DEFAULT_SETTINGS.instructions,
    contact_email: DEFAULT_SETTINGS.contact_email,
    contact_whatsapp: DEFAULT_SETTINGS.contact_whatsapp,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    try {
      const response = await apiService.getPaymentSettings();
      if (response.success && response.data) {
        const record = response.data as PaymentSettings;
        setSettings(record);
        setForm({
          cod_enabled: record.cod_enabled,
          mobile_payment_enabled: record.mobile_payment_enabled,
          account_title: record.account_title,
          account_number: record.account_number,
          iban: record.iban,
          bank_name: record.bank_name,
          instructions: record.instructions,
          contact_email: record.contact_email,
          contact_whatsapp: record.contact_whatsapp,
        });
      } else {
        setSettings(null);
        setForm({
          cod_enabled: DEFAULT_SETTINGS.cod_enabled,
          mobile_payment_enabled: DEFAULT_SETTINGS.mobile_payment_enabled,
          account_title: DEFAULT_SETTINGS.account_title,
          account_number: DEFAULT_SETTINGS.account_number,
          iban: DEFAULT_SETTINGS.iban,
          bank_name: DEFAULT_SETTINGS.bank_name,
          instructions: DEFAULT_SETTINGS.instructions,
          contact_email: DEFAULT_SETTINGS.contact_email,
          contact_whatsapp: DEFAULT_SETTINGS.contact_whatsapp,
        });
      }
    } catch (error) {
      console.error('Failed to load payment settings', error);
      toast({ title: 'Error', description: 'Failed to load payment options', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const payload = {
        cod_enabled: form.cod_enabled,
        mobile_payment_enabled: form.mobile_payment_enabled,
        account_title: form.account_title.trim(),
        account_number: form.account_number.trim(),
        iban: form.iban.trim(),
        bank_name: form.bank_name.trim(),
        instructions: form.instructions.trim(),
        contact_email: form.contact_email.trim(),
        contact_whatsapp: form.contact_whatsapp.trim(),
      };

      const response = await apiService.updatePaymentSettings(payload);
      if (!response.success) {
        throw new Error(response.message || "Failed to update payment settings");
      }

      toast({ title: 'Saved', description: 'Payment options updated successfully.' });
      await loadSettings();
    } catch (error) {
      console.error('Failed to save payment settings', error);
      toast({ title: 'Error', description: 'Failed to save payment options', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Payment Options</h2>
          <p className="text-muted-foreground">Control which payment methods appear for customers and manage bank transfer instructions.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={loadSettings} disabled={loading}>
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            {saving ? 'Saving...' : 'Save'}
          </Button>
        </div>
      </div>

      <Card className="shadow-soft">
        <CardHeader>
          <CardTitle>Available Payment Methods</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between rounded-lg border px-3 py-2">
            <div>
              <h3 className="font-semibold">Cash on Delivery (COD)</h3>
              <p className="text-sm text-muted-foreground">Show the COD option during checkout.</p>
            </div>
            <Switch
              checked={form.cod_enabled}
              onCheckedChange={(checked) => setForm((prev) => ({ ...prev, cod_enabled: checked }))}
            />
          </div>

          <div className="rounded-lg border px-3 py-2">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Online Payment for Mobile App Users</h3>
                <p className="text-sm text-muted-foreground">Show bank transfer instructions for customers selecting online payment.</p>
              </div>
              <Switch
                checked={form.mobile_payment_enabled}
                onCheckedChange={(checked) => setForm((prev) => ({ ...prev, mobile_payment_enabled: checked }))}
              />
            </div>
            {form.mobile_payment_enabled && (
              <div className="mt-4 space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_title">Account title</Label>
                    <Input
                      id="account_title"
                      value={form.account_title}
                      onChange={(event) => setForm((prev) => ({ ...prev, account_title: event.target.value }))}
                      placeholder="Phresh"
                    />
                  </div>
                  <div>
                    <Label htmlFor="bank_name">Bank name</Label>
                    <Input
                      id="bank_name"
                      value={form.bank_name}
                      onChange={(event) => setForm((prev) => ({ ...prev, bank_name: event.target.value }))}
                      placeholder="Meezan Bank"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="account_number">Account number</Label>
                    <Input
                      id="account_number"
                      value={form.account_number}
                      onChange={(event) => setForm((prev) => ({ ...prev, account_number: event.target.value }))}
                      placeholder="0198 0104 5369 40"
                    />
                  </div>
                  <div>
                    <Label htmlFor="iban">IBAN</Label>
                    <Input
                      id="iban"
                      value={form.iban}
                      onChange={(event) => setForm((prev) => ({ ...prev, iban: event.target.value }))}
                      placeholder="PK60 MEZN 0001 9801 0453 6940"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="instructions">Payment instructions</Label>
                  <Textarea
                    id="instructions"
                    value={form.instructions}
                    onChange={(event) => setForm((prev) => ({ ...prev, instructions: event.target.value }))}
                    rows={6}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="contact_email">Contact email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={form.contact_email}
                      onChange={(event) => setForm((prev) => ({ ...prev, contact_email: event.target.value }))}
                      placeholder="support@phresh.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="contact_whatsapp">WhatsApp number</Label>
                    <Input
                      id="contact_whatsapp"
                      value={form.contact_whatsapp}
                      onChange={(event) => setForm((prev) => ({ ...prev, contact_whatsapp: event.target.value }))}
                      placeholder="03433372507"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
