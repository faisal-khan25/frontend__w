import { useEffect, useRef, useState } from "react";
import {
  IdCard,
  Camera,
  RefreshCw,
  Plus,
  Trash2,
  Pencil,
  Save,
  X,
  KeyRound,
  GraduationCap,
  Sparkles,
  Briefcase,
  ShieldAlert,
} from "lucide-react";
import * as profileService from "../../../services/profileService";

const TABS = [
  { id: "personal", label: "Personal Info" },
  { id: "emergency", label: "Emergency Contact" },
  { id: "education", label: "Education" },
  { id: "skills", label: "Skills" },
  { id: "experience", label: "Experience" },
  { id: "security", label: "Change Password" },
];

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs font-medium text-faint uppercase tracking-wide">{label}</span>
      {children}
    </label>
  );
}

const inputCls =
  "mt-1 w-full rounded-xl border border-line bg-canvas px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-primary-200 focus:border-primary";

export default function ProfileEditor({ user, onUserUpdated }) {
  const [tab, setTab] = useState("personal");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const fileInputRef = useRef(null);
  const [uploading, setUploading] = useState(false);

  const [form, setForm] = useState({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await profileService.getMyProfile();
      setData(res);
      setForm(flattenForm(res.profile));
    } catch (err) {
      setError("Unable to load profile.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  function flattenForm(profile) {
    return {
      designation: profile?.designation || "",
      workType: profile?.workType || "",
      dateOfBirth: profile?.dateOfBirth || "",
      gender: profile?.gender || "",
      bloodGroup: profile?.bloodGroup || "",
      maritalStatus: profile?.maritalStatus || "",
      personalEmail: profile?.personalEmail || "",
      personalPhone: profile?.personalPhone || "",
      workPhone: profile?.workPhone || "",
      addressLine1: profile?.addressLine1 || "",
      addressLine2: profile?.addressLine2 || "",
      city: profile?.city || "",
      state: profile?.state || "",
      country: profile?.country || "",
      pincode: profile?.pincode || "",
      panNumber: profile?.panNumber || "",
      aadhaarNumber: profile?.aadhaarNumber || "",
      emergencyName: profile?.emergencyContact?.name || "",
      emergencyRelation: profile?.emergencyContact?.relation || "",
      emergencyPhone: profile?.emergencyContact?.phone || "",
      emergencyAddress: profile?.emergencyContact?.address || "",
    };
  }

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function saveSection(fields) {
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      const payload = {};
      fields.forEach((f) => {
        payload[f] = form[f];
      });
      if (fields.some((f) => f.startsWith("emergency"))) {
        payload.emergencyContact = {
          name: form.emergencyName,
          relation: form.emergencyRelation,
          phone: form.emergencyPhone,
          address: form.emergencyAddress,
        };
        ["emergencyName", "emergencyRelation", "emergencyPhone", "emergencyAddress"].forEach(
          (f) => delete payload[f]
        );
      }
      const res = await profileService.updateProfile(payload);
      setData(res);
      setForm(flattenForm(res.profile));
      setMessage("Saved successfully.");
    } catch (err) {
      setError(err.response?.data?.error || "Unable to save changes.");
    } finally {
      setSaving(false);
    }
  }

  async function handlePictureChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setError(null);
    try {
      const updatedUser = await profileService.uploadProfilePicture(file);
      onUserUpdated?.(updatedUser);
    } catch (err) {
      setError(err.response?.data?.error || "Unable to upload picture.");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const initials = (user?.name || "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0]?.toUpperCase())
    .join("");

  return (
    <div id="profile-editor" className="card card-pad scroll-mt-20">
      <div className="flex items-center justify-between mb-5">
        <h2 className="font-display text-lg font-bold text-ink flex items-center gap-2">
          <IdCard size={18} className="text-primary" /> My Profile
        </h2>
        {data?.profile?.employeeCode && (
          <span className="badge-primary">{data.profile.employeeCode}</span>
        )}
      </div>

      <div className="flex items-center gap-4 mb-6">
        <div className="relative">
          <div className="w-20 h-20 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-2xl font-bold overflow-hidden">
            {user?.profileImage ? (
              <img
                src={
                  user.profileImage.startsWith("http")
                    ? user.profileImage
                    : `${(import.meta.env.VITE_API_BASE_URL || "/api/v1").replace(/\/api\/v1$/, "")}${user.profileImage}`
                }
                alt=""
                className="w-full h-full object-cover"
              />
            ) : (
              initials || "U"
            )}
          </div>
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center shadow-card"
            aria-label="Change profile picture"
            title="Change profile picture"
          >
            {uploading ? <RefreshCw size={14} className="animate-spin" /> : <Camera size={14} />}
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePictureChange}
          />
        </div>
        <div className="min-w-0">
          <p className="font-display text-lg font-bold text-ink truncate">{user?.name}</p>
          <p className="text-sm text-muted truncate">{data?.profile?.designation || "Designation not set"}</p>
          <p className="text-xs text-faint">{user?.email}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 mb-5 border-b border-line pb-3">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => {
              setTab(t.id);
              setMessage(null);
              setError(null);
            }}
            className={`pill !py-1.5 !px-3.5 text-xs font-semibold ${
              tab === t.id ? "!bg-primary !text-white !border-primary" : ""
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {message && <div className="state-success mb-4">{message}</div>}
      {error && <div className="state-error mb-4">{error}</div>}

      {loading ? (
        <div className="state-loading">
          <RefreshCw size={16} className="animate-spin" /> Loading profile…
        </div>
      ) : (
        <>
          {tab === "personal" && (
            <PersonalInfoTab form={form} update={update} saving={saving} onSave={saveSection} />
          )}
          {tab === "emergency" && (
            <EmergencyContactTab form={form} update={update} saving={saving} onSave={saveSection} />
          )}
          {tab === "education" && <EducationTab items={data?.education || []} onChanged={load} />}
          {tab === "skills" && <SkillsTab items={data?.skills || []} onChanged={load} />}
          {tab === "experience" && <ExperienceTab items={data?.experience || []} onChanged={load} />}
          {tab === "security" && <SecurityTab />}
        </>
      )}
    </div>
  );
}

function PersonalInfoTab({ form, update, saving, onSave }) {
  const fields = [
    "designation",
    "workType",
    "dateOfBirth",
    "gender",
    "bloodGroup",
    "maritalStatus",
    "personalEmail",
    "personalPhone",
    "workPhone",
    "addressLine1",
    "addressLine2",
    "city",
    "state",
    "country",
    "pincode",
    "panNumber",
    "aadhaarNumber",
  ];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(fields);
      }}
      className="space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Designation">
          <input className={inputCls} value={form.designation} onChange={(e) => update("designation", e.target.value)} />
        </Field>
        <Field label="Work Type">
          <select className={inputCls} value={form.workType} onChange={(e) => update("workType", e.target.value)}>
            <option value="">Select…</option>
            <option value="OFFICE">Office</option>
            <option value="REMOTE">Remote</option>
            <option value="HYBRID">Hybrid</option>
          </select>
        </Field>
        <Field label="Date of Birth">
          <input type="date" className={inputCls} value={form.dateOfBirth || ""} onChange={(e) => update("dateOfBirth", e.target.value)} />
        </Field>
        <Field label="Gender">
          <select className={inputCls} value={form.gender} onChange={(e) => update("gender", e.target.value)}>
            <option value="">Select…</option>
            <option value="MALE">Male</option>
            <option value="FEMALE">Female</option>
            <option value="OTHER">Other</option>
            <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
          </select>
        </Field>
        <Field label="Blood Group">
          <input className={inputCls} value={form.bloodGroup} onChange={(e) => update("bloodGroup", e.target.value)} placeholder="O+" />
        </Field>
        <Field label="Marital Status">
          <select className={inputCls} value={form.maritalStatus} onChange={(e) => update("maritalStatus", e.target.value)}>
            <option value="">Select…</option>
            <option value="SINGLE">Single</option>
            <option value="MARRIED">Married</option>
            <option value="DIVORCED">Divorced</option>
            <option value="WIDOWED">Widowed</option>
          </select>
        </Field>
        <Field label="Personal Email">
          <input type="email" className={inputCls} value={form.personalEmail} onChange={(e) => update("personalEmail", e.target.value)} />
        </Field>
        <Field label="Personal Mobile">
          <input className={inputCls} value={form.personalPhone} onChange={(e) => update("personalPhone", e.target.value)} />
        </Field>
        <Field label="Work Phone">
          <input className={inputCls} value={form.workPhone} onChange={(e) => update("workPhone", e.target.value)} />
        </Field>
        <Field label="PAN Number">
          <input className={inputCls} value={form.panNumber} onChange={(e) => update("panNumber", e.target.value)} />
        </Field>
        <Field label="Aadhaar Number">
          <input className={inputCls} value={form.aadhaarNumber} onChange={(e) => update("aadhaarNumber", e.target.value)} />
        </Field>
        <Field label="Pincode">
          <input className={inputCls} value={form.pincode} onChange={(e) => update("pincode", e.target.value)} />
        </Field>
        <Field label="Address Line 1">
          <input className={inputCls} value={form.addressLine1} onChange={(e) => update("addressLine1", e.target.value)} />
        </Field>
        <Field label="Address Line 2">
          <input className={inputCls} value={form.addressLine2} onChange={(e) => update("addressLine2", e.target.value)} />
        </Field>
        <Field label="City">
          <input className={inputCls} value={form.city} onChange={(e) => update("city", e.target.value)} />
        </Field>
        <Field label="State">
          <input className={inputCls} value={form.state} onChange={(e) => update("state", e.target.value)} />
        </Field>
        <Field label="Country">
          <input className={inputCls} value={form.country} onChange={(e) => update("country", e.target.value)} />
        </Field>
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        <Save size={16} /> {saving ? "Saving…" : "Save Personal Info"}
      </button>
    </form>
  );
}

function EmergencyContactTab({ form, update, saving, onSave }) {
  const fields = ["emergencyName", "emergencyRelation", "emergencyPhone", "emergencyAddress"];
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSave(fields);
      }}
      className="space-y-4"
    >
      <div className="grid sm:grid-cols-2 gap-4">
        <Field label="Contact Name">
          <input className={inputCls} value={form.emergencyName} onChange={(e) => update("emergencyName", e.target.value)} />
        </Field>
        <Field label="Relationship">
          <input className={inputCls} value={form.emergencyRelation} onChange={(e) => update("emergencyRelation", e.target.value)} placeholder="Spouse, Parent…" />
        </Field>
        <Field label="Phone Number">
          <input className={inputCls} value={form.emergencyPhone} onChange={(e) => update("emergencyPhone", e.target.value)} />
        </Field>
        <Field label="Address">
          <input className={inputCls} value={form.emergencyAddress} onChange={(e) => update("emergencyAddress", e.target.value)} />
        </Field>
      </div>
      <button type="submit" disabled={saving} className="btn-primary">
        <Save size={16} /> {saving ? "Saving…" : "Save Emergency Contact"}
      </button>
    </form>
  );
}

function EducationTab({ items, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({ degree: "", institution: "", fieldOfStudy: "", startYear: "", endYear: "", grade: "" });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await profileService.addEducation({
        ...form,
        startYear: form.startYear ? Number(form.startYear) : undefined,
        endYear: form.endYear ? Number(form.endYear) : undefined,
      });
      setForm({ degree: "", institution: "", fieldOfStudy: "", startYear: "", endYear: "", grade: "" });
      setAdding(false);
      onChanged();
    } catch (e2) {
      setErr(e2.response?.data?.error || "Unable to add education.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    try {
      await profileService.deleteEducation(id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-ink flex items-center gap-2">
          <GraduationCap size={16} className="text-primary" /> Education History
        </p>
        <button className="btn-outline btn-sm" onClick={() => setAdding((a) => !a)}>
          {adding ? <X size={14} /> : <Plus size={14} />} {adding ? "Cancel" : "Add"}
        </button>
      </div>

      {err && <div className="state-error mb-3">{err}</div>}

      {adding && (
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-canvas border border-line">
          <input required className={inputCls} placeholder="Degree" value={form.degree} onChange={(e) => setForm((f) => ({ ...f, degree: e.target.value }))} />
          <input required className={inputCls} placeholder="Institution" value={form.institution} onChange={(e) => setForm((f) => ({ ...f, institution: e.target.value }))} />
          <input className={inputCls} placeholder="Field of Study" value={form.fieldOfStudy} onChange={(e) => setForm((f) => ({ ...f, fieldOfStudy: e.target.value }))} />
          <input className={inputCls} placeholder="Grade / GPA" value={form.grade} onChange={(e) => setForm((f) => ({ ...f, grade: e.target.value }))} />
          <input className={inputCls} placeholder="Start Year" type="number" value={form.startYear} onChange={(e) => setForm((f) => ({ ...f, startYear: e.target.value }))} />
          <input className={inputCls} placeholder="End Year" type="number" value={form.endYear} onChange={(e) => setForm((f) => ({ ...f, endYear: e.target.value }))} />
          <button disabled={busy} className="btn-primary btn-sm sm:col-span-2">
            <Save size={14} /> Save
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-faint">No education records added yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{it.degree} · {it.institution}</p>
                <p className="text-xs text-muted">
                  {it.fieldOfStudy ? `${it.fieldOfStudy} · ` : ""}
                  {it.startYear || "—"}–{it.endYear || "Present"}
                  {it.grade ? ` · ${it.grade}` : ""}
                </p>
              </div>
              <button disabled={busy} onClick={() => remove(it.id)} className="text-coral hover:opacity-70 shrink-0">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SkillsTab({ items, onChanged }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [name, setName] = useState("");
  const [proficiency, setProficiency] = useState("INTERMEDIATE");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setErr(null);
    try {
      await profileService.addSkill({ skillName: name.trim(), proficiency });
      setName("");
      onChanged();
    } catch (e2) {
      setErr(e2.response?.data?.error || "Unable to add skill.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    try {
      await profileService.deleteSkill(id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <p className="text-sm font-semibold text-ink flex items-center gap-2 mb-4">
        <Sparkles size={16} className="text-primary" /> Skills
      </p>

      {err && <div className="state-error mb-3">{err}</div>}

      <form onSubmit={submit} className="flex flex-wrap gap-2 mb-5">
        <input className={`${inputCls} !mt-0 flex-1 min-w-[10rem]`} placeholder="Add a skill…" value={name} onChange={(e) => setName(e.target.value)} />
        <select className={`${inputCls} !mt-0 w-40`} value={proficiency} onChange={(e) => setProficiency(e.target.value)}>
          <option value="BEGINNER">Beginner</option>
          <option value="INTERMEDIATE">Intermediate</option>
          <option value="ADVANCED">Advanced</option>
          <option value="EXPERT">Expert</option>
        </select>
        <button disabled={busy} className="btn-primary btn-sm">
          <Plus size={14} /> Add
        </button>
      </form>

      {items.length === 0 ? (
        <p className="text-sm text-faint">No skills added yet.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {items.map((s) => (
            <span key={s.id} className="badge-sky !py-1.5">
              {s.skillName} <span className="opacity-60">· {s.proficiency.toLowerCase()}</span>
              <button disabled={busy} onClick={() => remove(s.id)} className="ml-1">
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

function ExperienceTab({ items, onChanged }) {
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [form, setForm] = useState({
    companyName: "",
    designation: "",
    startDate: "",
    endDate: "",
    isCurrent: false,
    description: "",
  });

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    try {
      await profileService.addExperience({ ...form, endDate: form.isCurrent ? undefined : form.endDate || undefined });
      setForm({ companyName: "", designation: "", startDate: "", endDate: "", isCurrent: false, description: "" });
      setAdding(false);
      onChanged();
    } catch (e2) {
      setErr(e2.response?.data?.error || "Unable to add experience.");
    } finally {
      setBusy(false);
    }
  }

  async function remove(id) {
    setBusy(true);
    try {
      await profileService.deleteExperience(id);
      onChanged();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <p className="text-sm font-semibold text-ink flex items-center gap-2">
          <Briefcase size={16} className="text-primary" /> Work Experience
        </p>
        <button className="btn-outline btn-sm" onClick={() => setAdding((a) => !a)}>
          {adding ? <X size={14} /> : <Plus size={14} />} {adding ? "Cancel" : "Add"}
        </button>
      </div>

      {err && <div className="state-error mb-3">{err}</div>}

      {adding && (
        <form onSubmit={submit} className="grid sm:grid-cols-2 gap-3 mb-5 p-4 rounded-xl bg-canvas border border-line">
          <input required className={inputCls} placeholder="Company Name" value={form.companyName} onChange={(e) => setForm((f) => ({ ...f, companyName: e.target.value }))} />
          <input required className={inputCls} placeholder="Designation" value={form.designation} onChange={(e) => setForm((f) => ({ ...f, designation: e.target.value }))} />
          <input required type="date" className={inputCls} value={form.startDate} onChange={(e) => setForm((f) => ({ ...f, startDate: e.target.value }))} />
          <input type="date" disabled={form.isCurrent} className={inputCls} value={form.endDate} onChange={(e) => setForm((f) => ({ ...f, endDate: e.target.value }))} />
          <label className="flex items-center gap-2 text-sm text-ink sm:col-span-2">
            <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm((f) => ({ ...f, isCurrent: e.target.checked }))} />
            I currently work here
          </label>
          <textarea className={`${inputCls} sm:col-span-2`} rows={2} placeholder="Description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} />
          <button disabled={busy} className="btn-primary btn-sm sm:col-span-2">
            <Save size={14} /> Save
          </button>
        </form>
      )}

      {items.length === 0 ? (
        <p className="text-sm text-faint">No work experience added yet.</p>
      ) : (
        <ul className="space-y-2">
          {items.map((it) => (
            <li key={it.id} className="flex items-start justify-between gap-3 rounded-xl border border-line px-4 py-3">
              <div className="min-w-0">
                <p className="text-sm font-semibold text-ink">{it.designation} · {it.companyName}</p>
                <p className="text-xs text-muted">
                  {it.startDate} – {it.isCurrent ? "Present" : it.endDate || "—"}
                </p>
                {it.description && <p className="text-xs text-faint mt-1">{it.description}</p>}
              </div>
              <button disabled={busy} onClick={() => remove(it.id)} className="text-coral hover:opacity-70 shrink-0">
                <Trash2 size={16} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const [ok, setOk] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setErr(null);
    setOk(false);
    if (form.newPassword !== form.confirmPassword) {
      setErr("New password and confirmation do not match.");
      return;
    }
    setBusy(true);
    try {
      await profileService.changePassword(form);
      setOk(true);
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (e2) {
      setErr(e2.response?.data?.error || "Unable to change password.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4 max-w-md">
      <p className="text-sm font-semibold text-ink flex items-center gap-2 mb-1">
        <KeyRound size={16} className="text-primary" /> Change Password
      </p>
      {ok && <div className="state-success">Password changed successfully.</div>}
      {err && <div className="state-error">{err}</div>}
      <Field label="Current Password">
        <input required type="password" className={inputCls} value={form.currentPassword} onChange={(e) => setForm((f) => ({ ...f, currentPassword: e.target.value }))} />
      </Field>
      <Field label="New Password">
        <input required type="password" className={inputCls} value={form.newPassword} onChange={(e) => setForm((f) => ({ ...f, newPassword: e.target.value }))} />
      </Field>
      <Field label="Confirm New Password">
        <input required type="password" className={inputCls} value={form.confirmPassword} onChange={(e) => setForm((f) => ({ ...f, confirmPassword: e.target.value }))} />
      </Field>
      <div className="flex items-start gap-2 text-xs text-faint">
        <ShieldAlert size={14} className="shrink-0 mt-0.5" />
        Must be at least 8 characters with an uppercase, lowercase, number and special character.
      </div>
      <button type="submit" disabled={busy} className="btn-primary">
        <Pencil size={16} /> {busy ? "Updating…" : "Update Password"}
      </button>
    </form>
  );
}
