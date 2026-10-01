import React, { useEffect, useState } from "react";
import {
    Building2,
    Plus,
    Pencil,
    X,
    Power,
    Loader2,
    Tags,
} from "lucide-react";
import {
    getDepartments,
    createDepartment,
    updateDepartment,
} from "../../../services/AdminService";
import {
    PageHeader,
    Spinner,
    EmptyState,
    ErrorBanner,
    FIELD_CLASS,
    LABEL_CLASS,
    PRIMARY_BUTTON_CLASS,
    SECONDARY_BUTTON_CLASS,
} from "../../component/admin/ui";
import Toast from "../../component/admin/Toast";
import { useToast } from "../../Hooks/useToast";
import useCategories from "../../Hooks/useCategories";

const emptyForm = { name: "", description: "", categories: [] };

const AdminDepartments = () => {
    const [ departments, setDepartments ] = useState([]);
    const [ loading, setLoading ] = useState(true);
    const [ errorMsg, setErrorMsg ] = useState("");
    const [ reloadToken, setReloadToken ] = useState(0);

    // The complaint types a department can be given. Read from the API, so a type
    // an admin added on the Categories screen is assignable here immediately
    const { categories, loading: categoriesLoading } = useCategories();

    // Creating always uses the inline form at the top of the page
    const [ form, setForm ] = useState(emptyForm);
    const [ creating, setCreating ] = useState(false);
    const [ createError, setCreateError ] = useState("");

    // Editing uses a dialog, because renaming or retiring deserves a confirmation
    const [ editing, setEditing ] = useState(null);
    const [ saving, setSaving ] = useState(false);
    const [ editError, setEditError ] = useState("");

    const { toast, showToast, clearToast } = useToast();

    // Adds or removes a value from a category list and returns the new list.
// A pure function rather than one that sets state, because the create form and the
// edit dialog each hold their own copy in a differently shaped object and both
// need the same behaviour
const toggleValue = (list, value) =>
    list.includes(value)
        ? list.filter((item) => item !== value)
        : [...list, value];

    // The chips a department owns, plus how many of the complaint types exist in
    // total. Shown on the row so an admin can see at a glance which department has
    // nothing to work on without opening the dialog
    const categoryChips = (department) => {
        if (!department.categories?.length) {
            return (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-0.5">
                    No categories
                </span>
            );
        }

        return department.categories.map((value) => (
            <span
                key={value}
                className="text-xs text-blue-800 bg-blue-50 border border-blue-200 rounded px-2 py-0.5"
            >
                {categories.find((item) => item.value === value)?.label || value}
            </span>
        ));
    };

    // The reload token lets a create or an edit refresh the list by re-running the
    // effect, instead of repeating the fetch inline
    useEffect(() => {
        let active = true;

        const loadDepartments = async () => {
            try {
                const response = await getDepartments();

                if (!active) return;

                setErrorMsg("");
                setDepartments(response.departments);
            } catch (error) {
                if (!active) return;

                setErrorMsg(
                    error.response?.data?.message || "Could not load the departments.",
                );
            } finally {
                if (active) setLoading(false);
            }
        };

        loadDepartments();

        return () => {
            active = false;
        };
    }, [reloadToken]);

    const reloadDepartments = () => setReloadToken((token) => token + 1);

    const formatDate = (value) => {
        if (!value) return "";

        const date = new Date(value);

        if (Number.isNaN(date.getTime())) return "";

        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    const handleCreate = async (e) => {
        e.preventDefault();

        if (creating) return;

        setCreateError("");
        setCreating(true);

        try {
            await createDepartment(form.name.trim(), form.description.trim(), form.categories);

            setForm(emptyForm);
            showToast("success", "Department created.");
            reloadDepartments();
        } catch (error) {
            setCreateError(
                error.response?.data?.message || "Could not create the department.",
            );
        } finally {
            setCreating(false);
        }
    };

    const handleSave = async () => {
        if (saving) return;

        setEditError("");
        setSaving(true);

        try {
            // Only what changed is sent, the controller leaves the rest as it is.
            // categories always goes, because unchecking every box is a real
            // instruction and an absent field would be treated as "no change"
            await updateDepartment(editing._id, {
                name: editing.name.trim(),
                description: editing.description.trim(),
                categories: editing.categories || [],
                isActive: editing.isActive,
            });

            showToast("success", `${editing.name} updated.`);
            setEditing(null);
            reloadDepartments();
        } catch (error) {
            setEditError(
                error.response?.data?.message || "Could not save the changes.",
            );
        } finally {
            setSaving(false);
        }
    };

    // Retiring is a single field change, so it skips the dialog
    const handleToggleActive = async (department) => {
        const nextActive = !department.isActive;

        // Shown straight away, reverted if the server refuses
        setDepartments((previous) =>
            previous.map((item) =>
                item._id === department._id
                    ? { ...item, isActive: nextActive }
                    : item,
            ),
        );

        try {
            await updateDepartment(department._id, { isActive: nextActive });

            showToast(
                "success",
                `${department.name} ${nextActive ? "reactivated" : "retired"}.`,
            );
        } catch (error) {
            setDepartments((previous) =>
                previous.map((item) =>
                    item._id === department._id
                        ? { ...item, isActive: department.isActive }
                        : item,
                ),
            );

            showToast(
                "error",
                error.response?.data?.message || "Could not update the department.",
            );
        }
    };

    return (
        <div>
            <PageHeader
                title="Departments"
                subtitle="Reports are routed to a department, a retired one keeps its history but takes no new work"
            />

            {/* ==================== CREATE ==================== */}
            <form
                onSubmit={handleCreate}
                className="bg-white border border-gray-200 rounded-2xl shadow-sm p-5"
            >
                <div className="flex items-center gap-2">
                    <Plus size={18} className="text-blue-700" />

                    <h2 className="font-bold text-gray-900">Add a department</h2>
                </div>

                <div className="mt-4 grid grid-cols-1 lg:grid-cols-[1fr_2fr_auto] gap-3 items-start">
                    <div>
                        <label htmlFor="newName" className={LABEL_CLASS}>
                            Name
                        </label>

                        <input
                            id="newName"
                            type="text"
                            required
                            maxLength={100}
                            value={form.name}
                            onChange={(e) => {
                                setForm({ ...form, name: e.target.value });
                                if (createError) setCreateError("");
                            }}
                            placeholder="e.g. Road Maintenance"
                            className={FIELD_CLASS}
                        />
                    </div>

                    <div>
                        <label
                            htmlFor="newDescription"
                            className={LABEL_CLASS}
                        >
                            Description
                        </label>

                        <input
                            id="newDescription"
                            type="text"
                            required
                            maxLength={500}
                            value={form.description}
                            onChange={(e) => {
                                setForm({ ...form, description: e.target.value });
                                if (createError) setCreateError("");
                            }}
                            placeholder="What this department is responsible for"
                            className={FIELD_CLASS}
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={creating || categoriesLoading}
                        className={`${PRIMARY_BUTTON_CLASS} lg:mt-[26px]`}
                    >
                        {creating ? (
                            <>
                                <Loader2 size={16} className="animate-spin" />
                                Adding...
                            </>
                        ) : (
                            <>
                                <Plus size={16} />
                                Add
                            </>
                        )}
                    </button>
                </div>

                {/* ==================== CATEGORIES ==================== */}
                {/* The complaint types this department owns. This list is the whole
                    visible world of the department's own admin, so getting it
                    wrong here is what makes their portal look empty later */}
                <div className="mt-4">
                    <div className="flex items-center gap-2">
                        <Tags size={15} className="text-blue-700" />

                        <span className={LABEL_CLASS.replace("mb-1.5", "mb-0")}>
                            Categories handled
                        </span>

                        <span className="text-xs text-gray-400">
                            {form.categories.length} of {categories.length} selected
                        </span>
                    </div>

                    <div className="flex flex-wrap gap-2 mt-2">
                        {categoriesLoading ? (
                            <span className="text-xs text-gray-500">
                                Loading categories...
                            </span>
                        ) : (
                            categories.map((item) => {
                                const selected = form.categories.includes(item.value);

                                return (
                                    <button
                                        key={item.value}
                                        type="button"
                                        onClick={() =>
                                            setForm({
                                                ...form,
                                                categories: toggleValue(
                                                    form.categories,
                                                    item.value,
                                                ),
                                            })
                                        }
                                        aria-pressed={selected}
                                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold border cursor-pointer transition ${
                                            selected
                                                ? "bg-blue-700 text-white border-blue-700"
                                                : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })
                        )}
                    </div>
                </div>

                <div className="mt-3">
                    <ErrorBanner
                        message={createError}
                        onDismiss={() => setCreateError("")}
                    />
                </div>
            </form>

            {/* ==================== LIST ==================== */}
            <div className="mt-4 bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-200">
                    <h2 className="font-bold text-gray-900">
                        {loading
                            ? "Loading..."
                            : `${departments.length} ${
                                  departments.length === 1
                                      ? "department"
                                      : "departments"
                              }`}
                    </h2>
                </div>

                <ErrorBanner message={errorMsg} onDismiss={() => setErrorMsg("")} />

                {loading && !departments.length ? (
                    <div className="flex items-center justify-center gap-3 py-16 text-gray-500">
                        <Spinner />

                        <span className="text-sm">Loading departments...</span>
                    </div>
                ) : !departments.length ? (
                    <EmptyState
                        icon={Building2}
                        title="No departments yet"
                        body="Add the first one above, reports can only be assigned once a department exists."
                    />
                ) : (
                    <ul className="divide-y divide-gray-100">
                        {departments.map((department) => (
                            <li
                                key={department._id}
                                className="px-5 py-4 flex flex-col sm:flex-row sm:items-center gap-3"
                            >
                                <div
                                    className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                                        department.isActive
                                            ? "bg-blue-100 text-blue-700"
                                            : "bg-gray-100 text-gray-400"
                                    }`}
                                >
                                    <Building2 size={20} />
                                </div>

                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <p
                                            className={`font-semibold ${
                                                department.isActive
                                                    ? "text-gray-900"
                                                    : "text-gray-400 line-through"
                                            }`}
                                        >
                                            {department.name}
                                        </p>

                                        {!department.isActive && (
                                            <span className="px-2 py-0.5 rounded bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wide">
                                                Retired
                                            </span>
                                        )}
                                    </div>

                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {department.description || "No description"}
                                    </p>

                                    <p className="text-xs text-gray-400 mt-1">
                                        Added {formatDate(department.createdAt)}
                                    </p>
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setEditing({
                                                ...department,
                                            });
                                            setEditError("");
                                        }}
                                        className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border border-gray-200 rounded-lg text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        <Pencil size={14} />
                                        Edit
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() =>
                                            handleToggleActive(department)
                                        }
                                        className={`inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border rounded-lg cursor-pointer ${
                                            department.isActive
                                                ? "border-red-200 text-red-700 hover:bg-red-50"
                                                : "border-green-200 text-green-700 hover:bg-green-50"
                                        }`}
                                    >
                                        <Power size={14} />
                                        {department.isActive ? "Retire" : "Reactivate"}
                                    </button>
                                </div>
                            </li>
                        ))}
                    </ul>
                )}
            </div>

            {/* ==================== EDIT DIALOG ==================== */}
            {editing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
                    <div
                        className="absolute inset-0 bg-black/40"
                        onClick={() => setEditing(null)}
                        aria-hidden="true"
                    />

                    <div
                        className="relative w-full max-w-md bg-white rounded-2xl shadow-xl p-5"
                        role="dialog"
                        aria-modal="true"
                        aria-label="Edit department"
                    >
                        <div className="flex items-start gap-3">
                            <div className="w-9 h-9 rounded-lg bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                                <Pencil size={18} />
                            </div>

                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-gray-900">
                                    Edit department
                                </h3>

                                <p className="text-xs text-gray-500 mt-0.5">
                                    Changing the name does not affect reports
                                    already assigned to it.
                                </p>
                            </div>

                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                aria-label="Close"
                                className="shrink-0 p-1.5 rounded-lg text-gray-400 hover:bg-gray-100 cursor-pointer"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="mt-5 flex flex-col gap-4">
                            <div>
                                <label htmlFor="editName" className={LABEL_CLASS}>
                                    Name
                                </label>

                                <input
                                    id="editName"
                                    type="text"
                                    required
                                    maxLength={100}
                                    value={editing.name}
                                    onChange={(e) => {
                                        setEditing({ ...editing, name: e.target.value });
                                        if (editError) setEditError("");
                                    }}
                                    className={FIELD_CLASS}
                                />
                            </div>

                            <div>
                                <label
                                    htmlFor="editDescription"
                                    className={LABEL_CLASS}
                                >
                                    Description
                                </label>

                                <textarea
                                    id="editDescription"
                                    rows={3}
                                    maxLength={500}
                                    value={editing.description || ""}
                                    onChange={(e) => {
                                        setEditing({
                                            ...editing,
                                            description: e.target.value,
                                        });
                                        if (editError) setEditError("");
                                    }}
                                    className={`${FIELD_CLASS} resize-y`}
                                />
                            </div>

                            <label className="flex items-center gap-2.5 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={editing.isActive}
                                    onChange={(e) =>
                                        setEditing({
                                            ...editing,
                                            isActive: e.target.checked,
                                        })
                                    }
                                    className="w-4 h-4 accent-blue-700 cursor-pointer"
                                />

                                <span className="text-sm text-gray-700">
                                    Active, available for new assignments
                                </span>
                            </label>
                        </div>

                        <div className="mt-4">
                            <ErrorBanner
                                message={editError}
                                onDismiss={() => setEditError("")}
                            />
                        </div>

                        <div className="mt-5 flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setEditing(null)}
                                className={SECONDARY_BUTTON_CLASS}
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={handleSave}
                                disabled={saving}
                                className={PRIMARY_BUTTON_CLASS}
                            >
                                {saving ? (
                                    <>
                                        <Loader2 size={16} className="animate-spin" />
                                        Saving...
                                    </>
                                ) : (
                                    "Save changes"
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <Toast toast={toast} onDismiss={clearToast} />
        </div>
    );
};

export default AdminDepartments;