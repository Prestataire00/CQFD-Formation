-- Company settings for invoices and contracts
CREATE TABLE IF NOT EXISTS company_settings (
  id SERIAL PRIMARY KEY,
  company_name TEXT NOT NULL,
  legal_form TEXT,
  siret TEXT,
  tva_number TEXT,
  address TEXT,
  city TEXT,
  postal_code TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  bank_name TEXT,
  iban TEXT,
  bic TEXT,
  logo_url TEXT,
  invoice_prefix TEXT DEFAULT 'FAC',
  contract_prefix TEXT DEFAULT 'CTR',
  invoice_footer TEXT,
  contract_footer TEXT,
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Client contracts table
CREATE TABLE IF NOT EXISTS client_contracts (
  id SERIAL PRIMARY KEY,
  contract_number TEXT NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT,
  amount INTEGER NOT NULL,
  vat_rate INTEGER DEFAULT 20,
  vat_amount INTEGER,
  total_amount INTEGER,
  start_date TIMESTAMP,
  end_date TIMESTAMP,
  status TEXT DEFAULT 'draft' NOT NULL,
  signed_at TIMESTAMP,
  pdf_url TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Client invoices table (enhanced)
CREATE TABLE IF NOT EXISTS client_invoices (
  id SERIAL PRIMARY KEY,
  invoice_number TEXT NOT NULL,
  client_id INTEGER NOT NULL REFERENCES clients(id),
  contract_id INTEGER REFERENCES client_contracts(id),
  mission_id INTEGER REFERENCES missions(id),
  title TEXT NOT NULL,
  description TEXT,
  line_items JSONB,
  subtotal INTEGER NOT NULL,
  vat_rate INTEGER DEFAULT 20,
  vat_amount INTEGER,
  total_amount INTEGER NOT NULL,
  invoice_date TIMESTAMP DEFAULT NOW(),
  due_date TIMESTAMP,
  status TEXT DEFAULT 'draft' NOT NULL,
  paid_at TIMESTAMP,
  payment_method TEXT,
  payment_reference TEXT,
  pdf_url TEXT,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Insert default company settings
INSERT INTO company_settings (company_name, invoice_prefix, contract_prefix)
VALUES ('Votre Entreprise', 'FAC', 'CTR')
ON CONFLICT DO NOTHING;
