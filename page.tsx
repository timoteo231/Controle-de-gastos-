"use client";

import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Camera, Wallet, ReceiptText, ShoppingBasket, Plus, ShieldCheck, RefreshCw, LogIn, Trash2, X, FileText } from "lucide-react";

type Invoice = {
  id: string;
  store_name: string | null;
  issue_date: string | null;
  invoice_total: number;
  tax_total_reported: number | null;
  tax_total_estimated: number | null;
  source: string;
  parse_status: string;
  image_path?: string | null;
};

const money = (n: number) => new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(Number(n || 0));

export default function Home() {
  const [ready, setReady] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [tab, setTab] = useState<"home" | "new" | "history">("home");
  const [month, setMonth] = useState(new Date().toISOString().slice(0, 7));
  const [store, setStore] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [total, setTotal] = useState("");
  const [tax, setTax] = useState("");
  const [estimate, setEstimate] = useState("");
  const [photo, setPhoto] = useState<File | null>(null);
  const [product, setProduct] = useState("");
  const [price, setPrice] = useState("");

  useEffect(() => {
    let alive = true;
    const start = async () => {
      const { data: current } = await supabase.auth.getSession();
      if (!alive) return;
      if (current.session) {
        setSession(current.session);
        setReady(true);
        return;
      }
      const { data, error: authError } = await supabase.auth.signInAnonymously();
      if (!alive) return;
      if (authError) {
        setError("Não foi possível iniciar a sessão automática. No Supabase, habilite Authentication → Sign In / Providers → Anonymous Sign-Ins e tente novamente.");
        setReady(true);
        return;
      }
      setSession(data.session);
      setReady(true);
    };
    start();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });
    return () => {
      alive = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (session) loadInvoices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, month]);

  async function loadInvoices() {
    const start = `${month}-01`;
    const [year, m] = month.split("-").map(Number);
    const end = new Date(year, m, 0).toISOString().slice(0, 10);
    const { data, error: queryError } = await supabase
      .from("invoices")
      .select("*")
      .gte("issue_date", start)
      .lte("issue_date", end)
      .order("issue_date", { ascending: false });
    if (queryError) setError(`Erro ao carregar compras: ${queryError.message}`);
    else setInvoices((data || []) as Invoice[]);
  }

  const totals = useMemo(() => ({
    purchases: invoices.reduce((sum, item) => sum + Number(item.invoice_total || 0), 0),
    taxes: invoices.reduce((sum, item) => sum + Number(item.tax_total_reported ?? item.tax_total_estimated ?? 0), 0),
    count: invoices.length
  }), [invoices]);

  async function saveInvoice(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMessage("");
    if (!session?.user?.id) { setError("Sessão ainda não está pronta. Atualize a página."); return; }
    if (!store.trim() || !total || Number(total) <= 0) { setError("Informe o estabelecimento e o valor total."); return; }
    setBusy(true);
    let imagePath: string | null = null;
    try {
      if (photo) {
        const safeName = photo.name.replace(/[^a-zA-Z0-9._-]/g, "-");
        imagePath = `${session.user.id}/${Date.now()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("invoice-images").upload(imagePath, photo, { upsert: false, contentType: photo.type || "application/octet-stream" });
        if (uploadError) throw uploadError;
      }
      const payload: Record<string, unknown> = {
        user_id: session.user.id,
        store_name: store.trim(),
        issue_date: date,
        invoice_total: Number(total),
        tax_total_reported: tax ? Number(tax) : null,
        tax_total_estimated: estimate ? Number(estimate) : null,
        source: photo ? "upload" : "manual",
        parse_status: "manual"
      };
      if (imagePath) payload.image_path = imagePath;
      const { error: insertError } = await supabase.from("invoices").insert(payload);
      if (insertError) throw insertError;
      setStore(""); setTotal(""); setTax(""); setEstimate(""); setPhoto(null); setProduct(""); setPrice("");
      setMessage("Compra registrada com sucesso.");
      setTab("history");
      await loadInvoices();
    } catch (err: any) {
      setError(err?.message || "Não foi possível salvar a compra.");
    } finally { setBusy(false); }
  }

  async function deleteInvoice(item: Invoice) {
    if (!confirm("Deseja excluir esta compra?")) return;
    setError("");
    const { error: deleteError } = await supabase.from("invoices").delete().eq("id", item.id);
    if (deleteError) setError(deleteError.message);
    else { setMessage("Compra excluída."); await loadInvoices(); }
  }

  async function signOutLocal() {
    if (!confirm("Sair desta sessão pode impedir o acesso aos dados desta sessão anônima neste aparelho. Deseja continuar?")) return;
    await supabase.auth.signOut();
    setSession(null);
    setError("Sessão encerrada. Recarregue a página para iniciar uma nova sessão.");
  }

  if (!ready) return <main className="center"><div className="loader"><RefreshCw size={22}/> Preparando seu acesso...</div></main>;

  if (!session) return <main className="center"><section className="auth-card"><div className="brand-mark">C</div><p className="eyebrow">FINANÇAS PESSOAIS</p><h1>Controle de Compras</h1><p className="muted">Não foi possível iniciar o acesso automático.</p><p className="notice">{error}</p><button className="primary" onClick={() => location.reload()}><RefreshCw size={17}/> Tentar novamente</button></section></main>;

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand"><div className="brand-mark">C</div><div><p className="eyebrow">FINANÇAS PESSOAIS</p><h1>Controle de Compras</h1></div></div>
        <button className="icon-button" title="Encerrar sessão local" onClick={signOutLocal}><ShieldCheck size={19}/></button>
      </header>
      <p className="subtitle">Notas fiscais, produtos, impostos e despesas em um só lugar.</p>
      <div className="month-row"><label htmlFor="month">Período</label><input id="month" type="month" value={month} onChange={e => setMonth(e.target.value)}/><button className="icon-button" onClick={loadInvoices} title="Atualizar"><RefreshCw size={18}/></button></div>

      {error && <div className="alert error"><X size={18}/>{error}</div>}
      {message && <div className="alert success">{message}</div>}

      <nav className="tabs">
        <button className={tab === "home" ? "active" : ""} onClick={() => setTab("home")}><Wallet size={17}/> Visão geral</button>
        <button className={tab === "new" ? "active" : ""} onClick={() => setTab("new")}><Plus size={17}/> Nova compra</button>
        <button className={tab === "history" ? "active" : ""} onClick={() => setTab("history")}><ReceiptText size={17}/> Histórico</button>
      </nav>

      {tab === "home" && <section className="content">
        <div className="stats">
          <article className="stat"><span>Total em compras</span><strong>{money(totals.purchases)}</strong><Wallet/></article>
          <article className="stat"><span>Impostos informados/estimados</span><strong>{money(totals.taxes)}</strong><ReceiptText/></article>
          <article className="stat"><span>Notas registradas</span><strong>{totals.count}</strong><ShoppingBasket/></article>
        </div>
        <div className="panel"><div className="panel-heading"><div><h2>Compras recentes</h2><p className="muted">Lançamentos do período selecionado</p></div><button className="secondary" onClick={() => setTab("new")}><Plus size={16}/> Adicionar</button></div>
          {invoices.length === 0 ? <div className="empty"><ReceiptText size={30}/><p>Nenhuma compra neste período.</p><button className="primary" onClick={() => setTab("new")}>Registrar primeira compra</button></div> : <InvoiceList items={invoices.slice(0,5)} onDelete={deleteInvoice}/>}
        </div>
      </section>}

      {tab === "new" && <section className="panel form-panel"><div className="panel-heading"><div><h2>Registrar compra</h2><p className="muted">Preencha os dados da nota fiscal</p></div></div>
        <form onSubmit={saveInvoice} className="form">
          <label>Estabelecimento<input value={store} onChange={e => setStore(e.target.value)} placeholder="Nome da loja ou fornecedor" required/></label>
          <label>Data da compra<input type="date" value={date} onChange={e => setDate(e.target.value)} required/></label>
          <label>Valor total (R$)<input type="number" min="0.01" step="0.01" value={total} onChange={e => setTotal(e.target.value)} placeholder="0,00" required/></label>
          <div className="two"><label>Impostos informados (R$)<input type="number" min="0" step="0.01" value={tax} onChange={e => setTax(e.target.value)} placeholder="Opcional"/></label><label>Impostos estimados (R$)<input type="number" min="0" step="0.01" value={estimate} onChange={e => setEstimate(e.target.value)} placeholder="Opcional"/></label></div>
          <label>Produto (opcional)<input value={product} onChange={e => setProduct(e.target.value)} placeholder="Descrição do produto"/></label>
          <label>Preço do produto (opcional)<input type="number" min="0" step="0.01" value={price} onChange={e => setPrice(e.target.value)} placeholder="0,00"/></label>
          <label className="file-label"><Camera size={19}/> Foto ou PDF da nota<input type="file" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={e => setPhoto(e.target.files?.[0] || null)}/>{photo && <small>{photo.name}</small>}</label>
          <p className="hint">A imagem/PDF será armazenada em área privada. A leitura automática da nota ainda não está disponível; os valores devem ser preenchidos manualmente.</p>
          <button className="primary" disabled={busy}>{busy ? "Salvando..." : "Salvar compra"}</button>
        </form>
      </section>}

      {tab === "history" && <section className="panel"><div className="panel-heading"><div><h2>Histórico de compras</h2><p className="muted">{invoices.length} lançamento(s) no período</p></div></div>{invoices.length ? <InvoiceList items={invoices} onDelete={deleteInvoice}/> : <div className="empty"><FileText size={30}/><p>Nenhuma compra encontrada.</p></div>}</section>}

      <footer><ShieldCheck size={15}/> Seus dados ficam separados por sessão e protegidos pelas políticas do banco.</footer>
    </main>
  );
}

function InvoiceList({ items, onDelete }: { items: Invoice[]; onDelete: (item: Invoice) => void }) {
  return <div className="invoice-list">{items.map(item => <article className="invoice" key={item.id}><div className="invoice-icon"><ReceiptText size={20}/></div><div className="invoice-main"><strong>{item.store_name || "Compra sem estabelecimento"}</strong><span>{item.issue_date ? new Date(`${item.issue_date}T12:00:00`).toLocaleDateString("pt-BR") : "Sem data"}</span></div><div className="invoice-total">{money(item.invoice_total)}</div><button className="delete" title="Excluir" onClick={() => onDelete(item)}><Trash2 size={17}/></button></article>)}</div>;
}
