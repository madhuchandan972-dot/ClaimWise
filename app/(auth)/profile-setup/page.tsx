'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, Loader2, CheckCircle2, GraduationCap } from 'lucide-react';

const STATES = [
  'Andhra Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Delhi', 'Goa', 'Gujarat', 'Haryana',
  'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 'Maharashtra',
  'Manipur', 'Meghalaya', 'Odisha', 'Punjab', 'Rajasthan', 'Tamil Nadu', 'Telangana',
  'Tripura', 'Uttar Pradesh', 'Uttarakhand', 'West Bengal', 'Other',
];
const CATEGORIES = ['General', 'OBC', 'SC', 'ST', 'EWS'] as const;

interface FormState {
  name: string; phone: string; dob: string; gender: string; state: string; district: string;
  category: string; college: string; course: string; year: string; income: string;
}

const initial: FormState = {
  name: '', phone: '', dob: '', gender: '', state: '', district: '', category: '',
  college: '', course: '', year: '', income: '',
};

function incomeToNumber(display: string): number {
  // Accepts "280000", "2,80,000"
  const n = Number(display.replace(/[,\s₹]/g, ''));
  return Number.isFinite(n) && n >= 0 ? Math.round(n) : -1;
}

export default function ProfileSetupPage() {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initial);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);

  // Guard: must come signed-in right after signup
  useEffect(() => {
    fetch('/api/auth/session').then(async (r) => {
      if (r.status === 401) router.replace('/login');
      setCheckedIn(true);
    }).catch(() => router.replace('/login'));
  }, [router]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
    setErrors((p) => ({ ...p, [name]: undefined }));
  }, []);

  function validate(): Partial<Record<keyof FormState, string>> {
    const errs: Partial<Record<keyof FormState, string>> = {};
    if (form.name.trim().length < 2) errs.name = 'Enter your full name';
    if (!/^[0-9]{10}$/.test(form.phone.trim())) errs.phone = 'Enter a valid 10-digit number';
    if (!form.dob) errs.dob = 'Date of birth is required';
    if (!form.gender) errs.gender = 'Select your gender';
    if (!form.state) errs.state = 'Select your state';
    if (form.district.trim().length < 2) errs.district = 'Enter your district';
    if (!form.category) errs.category = 'Select your category';
    if (form.college.trim().length < 3) errs.college = 'Enter your college name';
    if (form.course.trim().length < 2) errs.course = 'Enter your course';
    if (!form.year) errs.year = 'Select your year of study';
    if (incomeToNumber(form.income) < 0) errs.income = 'Enter a valid annual family income (e.g. 2,40,000)';
    return errs;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGeneralError('');
    try {
      const res = await fetch('/api/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone,
          dob: form.dob,
          gender: form.gender,
          state: form.state,
          district: form.district,
          category: form.category,
          college: form.college,
          course: form.course,
          year: form.year,
          familyIncome: incomeToNumber(form.income),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.success) {
        setGeneralError(data.error ?? 'Could not save your profile. Please try again.');
        return;
      }
      router.push('/dashboard');
    } catch {
      setGeneralError('Network error. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  if (!checkedIn) return null;

  const selectCls = (err?: string) =>
    `input-field ${err ? 'border-red-400 focus:border-red-400 focus:ring-red-400/20' : ''}`;

  return (
    <div className="w-full">
      <div className="mb-2 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-50">
          <GraduationCap className="h-5 w-5 text-blue-600" />
        </span>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Set up your student profile</h1>
          <p className="text-sm text-gray-500">This powers your scholarship matching — you can edit everything later.</p>
        </div>
      </div>

      {generalError && (
        <div className="mt-4 mb-2 flex items-start gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3">
          <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
          <p className="text-xs text-red-600">{generalError}</p>
        </div>
      )}

      <div className="mt-5 rounded-2xl bg-white border border-gray-100 shadow-sm p-8">
        <form onSubmit={handleSubmit} noValidate className="space-y-5">
          {/* Personal */}
          <div>
            <h2 className="text-sm font-bold text-gray-900 mb-3">Personal details</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="name" className="label">Full name</label>
                <input id="name" name="name" value={form.name} onChange={handleChange} placeholder="As per your class 10 certificate" className="input-field" />
                {errors.name && <p className="mt-1.5 text-xs text-red-500">{errors.name}</p>}
              </div>
              <div>
                <label htmlFor="phone" className="label">Mobile number</label>
                <input id="phone" name="phone" inputMode="numeric" value={form.phone} onChange={handleChange} placeholder="10-digit number" className="input-field" />
                {errors.phone && <p className="mt-1.5 text-xs text-red-500">{errors.phone}</p>}
              </div>
              <div>
                <label htmlFor="dob" className="label">Date of birth</label>
                <input id="dob" name="dob" type="date" value={form.dob} onChange={handleChange} className="input-field" />
                {errors.dob && <p className="mt-1.5 text-xs text-red-500">{errors.dob}</p>}
              </div>
              <div>
                <label htmlFor="gender" className="label">Gender</label>
                <select id="gender" name="gender" value={form.gender} onChange={handleChange} className={selectCls(errors.gender)}>
                  <option value="">Select…</option>
                  <option value="Female">Female</option>
                  <option value="Male">Male</option>
                  <option value="Other">Other</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
                {errors.gender && <p className="mt-1.5 text-xs text-red-500">{errors.gender}</p>}
              </div>
              <div>
                <label htmlFor="state" className="label">Home state</label>
                <select id="state" name="state" value={form.state} onChange={handleChange} className={selectCls(errors.state)}>
                  <option value="">Select…</option>
                  {STATES.map((s) => (<option key={s} value={s}>{s}</option>))}
                </select>
                {errors.state && <p className="mt-1.5 text-xs text-red-500">{errors.state}</p>}
              </div>
              <div>
                <label htmlFor="district" className="label">District</label>
                <input id="district" name="district" value={form.district} onChange={handleChange} placeholder="e.g. Bengaluru Urban" className="input-field" />
                {errors.district && <p className="mt-1.5 text-xs text-red-500">{errors.district}</p>}
              </div>
            </div>
          </div>

          {/* Eligibility */}
          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Eligibility details</h2>
            <p className="text-xs text-gray-500 mb-4">These determine which scholarships you qualify for.</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="category" className="label">Social category</label>
                <select id="category" name="category" value={form.category} onChange={handleChange} className={selectCls(errors.category)}>
                  <option value="">Select…</option>
                  {CATEGORIES.map((c) => (<option key={c} value={c}>{c}</option>))}
                </select>
                {errors.category && <p className="mt-1.5 text-xs text-red-500">{errors.category}</p>}
              </div>
              <div>
                <label htmlFor="income" className="label">Annual family income (₹)</label>
                <input id="income" name="income" inputMode="numeric" value={form.income} onChange={handleChange} placeholder="e.g. 2,40,000" className="input-field" />
                {errors.income && <p className="mt-1.5 text-xs text-red-500">{errors.income}</p>}
              </div>
            </div>
          </div>

          {/* Education */}
          <div className="border-t border-gray-100 pt-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3">Education</h2>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <label htmlFor="college" className="label">College / Institution</label>
                <input id="college" name="college" value={form.college} onChange={handleChange} placeholder="e.g. RV College of Engineering" className="input-field" />
                {errors.college && <p className="mt-1.5 text-xs text-red-500">{errors.college}</p>}
              </div>
              <div>
                <label htmlFor="course" className="label">Course</label>
                <input id="course" name="course" value={form.course} onChange={handleChange} placeholder="e.g. B.E. Computer Science" className="input-field" />
                {errors.course && <p className="mt-1.5 text-xs text-red-500">{errors.course}</p>}
              </div>
              <div>
                <label htmlFor="year" className="label">Year of study</label>
                <select id="year" name="year" value={form.year} onChange={handleChange} className={selectCls(errors.year)}>
                  <option value="">Select…</option>
                  <option value="1st Year">1st Year</option>
                  <option value="2nd Year">2nd Year</option>
                  <option value="3rd Year">3rd Year</option>
                  <option value="4th Year">4th Year</option>
                  <option value="Postgraduate">Postgraduate</option>
                </select>
                {errors.year && <p className="mt-1.5 text-xs text-red-500">{errors.year}</p>}
              </div>
            </div>
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? (<><Loader2 className="w-4 h-4 animate-spin" /> Saving…</>) : (<><CheckCircle2 className="w-4 h-4" /> Save & Go to Dashboard</>)}
          </button>
        </form>
      </div>
    </div>
  );
}
