import React, { useEffect, useRef, useState } from "react";
import { Asterisk, Check, Copy, MapPin, Lock } from "lucide-react";
import Upload from "../assets/uploader.jpg";
import { createReport, saveReportToken } from "../../services/ReportService";
import { useClipboard } from "../Hooks/useClipboard";
import { CATEGORIES } from "../constants/categories";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useTranslation } from "react-i18next";

import L from "leaflet";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";
const DefaultIcon = L.icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

L.Marker.prototype.options.icon = DefaultIcon;

// Listens for a click on the map and writes the point into the form
const LocationMarker = ({ setLatitude, setLongitude }) => {
  useMapEvents({
    click(event) {
      setLatitude(event.latlng.lat);
      setLongitude(event.latlng.lng);
    },
  });

  return null;
};

// Follows the coordinates, since MapContainer only reads center on mount
const RecenterMap = ({ latitude, longitude }) => {
  const map = useMap();

  useEffect(() => {
    if (latitude != null && longitude != null) {
      map.setView([latitude, longitude], map.getZoom());
    }
  }, [latitude, longitude, map]);

  return null;
};

const Report = () => {
  const { t } = useTranslation();
  // Shared with the tracking page, so the copied value is the same and the
  // "Copied" state times itself out instead of sticking until a reload
  const { copied, copy } = useClipboard();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [image, setImage] = useState(null);
  const [reportId, setReportId] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [errors, setErrors] = useState({});
  const [preview, setPreview] = useState("");
  const fileInputRef = useRef(null);
  const MAX_IMAGE_SIZE = 5 * 1024 * 1024;
  const [latitude, setLatitude] = useState(null);
  const [longitude, setLongitude] = useState(null);

  const resetForm = () => {
    setTitle("");
    setCategory("");
    setDescription("");
    setAddress("");
    setName("");
    setEmail("");
    setPhone("");
    setImage(null);
    setErrors({});
    // Cleared too, or the next report silently inherits the last one's
    // coordinates and the map opens on the previous problem
    setLatitude(null);
    setLongitude(null);
    if (preview) URL.revokeObjectURL(preview);
    setPreview("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Each key maps to a field name, so a message renders under its own input.
  // The state holds a translation key, not a sentence, so switching language
  // re-renders the message in place instead of leaving it stuck in English.
  const fieldError = (name) =>
    errors[name] ? (
      <p className="text-xs text-red-600 mt-1">
        {t(`report.errors.${errors[name]}`)}
      </p>
    ) : null;

  const clearError = (name) =>
    setErrors((prev) => ({ ...prev, [name]: undefined }));

  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const submitHandler = async (e) => {
    e.preventDefault();
    const data = new FormData();
    setErrorMsg("");

    const next = {};
    if (!title.trim()) next.title = "titleRequired";
    if (!category) next.category = "categoryRequired";
    if (!description.trim()) next.description = "descriptionRequired";
    else if (description.length > 2000)
      next.description = "descriptionTooLong";
    if (!address.trim()) next.address = "addressRequired";
    if (!name.trim()) next.name = "nameRequired";
    if (!email.trim()) next.email = "emailRequired";
    else if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "emailInvalid";
    if (!phone.trim()) next.phone = "phoneRequired";
    else if (!/^[0-9]{10}$/.test(phone.trim()))
      next.phone = "phoneInvalid";
    if (!image) next.image = "imageRequired";
    else if (image.size > MAX_IMAGE_SIZE) next.image = "imageTooLarge";

    if (Object.keys(next).length) {
      setErrors(next);
      setErrorMsg(t("report.errors.fixFields"));
      return;
    }
    setErrors({});

    data.append("title", title);
    data.append("category", category);
    data.append("description", description);
    data.append(
      "location",
      JSON.stringify({
        address,
        latitude,
        longitude,
      }),
    );
    data.append(
      "reporter",
      JSON.stringify({
        name: name,
        email: email,
        phone: phone,
      }),
    );

    data.append("image", image);
    setLoading(true);
    try {
      const response = await createReport(data);
      setReportId(response.reportId);
      // Kept so the tracking page can show this report's photo and details.
      // Stored before the form resets, so a failure here cannot lose the id.
      saveReportToken(response.reportId, response.publicToken);
      resetForm();
    } catch (error) {
      setErrorMsg(
        error.response?.data?.message || t("report.errors.generic"),
      );
    } finally {
      setLoading(false);
    }
  };
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ==================== HEADER ==================== */}
      <div className="py-12 md:py-16 px-4 text-center bg-white border-b border-gray-200">
        <h1 className="text-blue-600 text-2xl md:text-4xl font-extrabold">
          {t("report.header.title")}
        </h1>

        <p className="text-gray-500 text-sm md:text-base mt-3">
          {t("report.header.subtitle")}
        </p>
      </div>

      {/* ==================== MAIN CONTAINER ==================== */}
      <div className="w-full max-w-4xl mx-auto px-4 sm:px-6 py-10 md:py-14">
        {/* ==================== PROGRESS ==================== */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5 md:p-6 mb-8">
          <div className="flex items-center justify-center">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                1
              </div>

              <span className="ml-2 text-sm md:text-base font-semibold text-blue-600">
                {t("report.steps.issue")}
              </span>
            </div>

            <div className="w-12 sm:w-20 h-[2px] bg-gray-300 mx-3"></div>

            {/* Step 2 */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">
                2
              </div>

              <span className="ml-2 text-sm md:text-base font-semibold text-gray-500">
                {t("report.steps.location")}
              </span>
            </div>

            <div className="w-12 sm:w-20 h-[2px] bg-gray-300 mx-3"></div>

            {/* Step 3 */}
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-gray-200 text-gray-500 flex items-center justify-center font-bold">
                3
              </div>

              <span className="ml-2 text-sm md:text-base font-semibold text-gray-500">
                {t("report.steps.you")}
              </span>
            </div>
          </div>
        </div>

        {/* ==================== SUCCESS ==================== */}
        {reportId && (
          <div className="mb-8 p-6 rounded-2xl bg-green-50 border border-green-200">
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold shrink-0">
                ✓
              </div>

              <div className="flex-1">
                <h3 className="text-base font-semibold text-green-800">
                  {t("report.success.title")}
                </h3>

                <p className="text-sm text-green-700 mt-1">
                  {t("report.success.description")}
                </p>

                <div className="flex flex-wrap items-center gap-3 mt-4">
                  <code className="px-4 py-2 bg-white border border-green-300 rounded-lg text-sm font-mono font-semibold text-green-800 select-all">
                    {reportId}
                  </code>

                  <button
                    type="button"
                    onClick={() => copy(reportId)}
                    className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-green-700 border border-green-300 rounded-lg hover:bg-green-100 active:scale-95 transition cursor-pointer"
                  >
                    {copied ? (
                      <Check size={16} />
                    ) : (
                      <Copy size={16} />
                    )}

                    {copied
                      ? t("report.success.copied")
                      : t("report.success.copyId")}
                  </button>
                </div>

                <p className="text-xs text-green-600 mt-3">
                  {t("report.success.keepIdHint")}
                </p>

                <button
                  type="button"
                  onClick={() => setReportId("")}
                  className="mt-4 text-sm font-semibold text-green-700 underline hover:text-green-900 cursor-pointer"
                >
                  {t("report.success.reportAnother")}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ==================== FORM ==================== */}
        <form className="space-y-8" onSubmit={submitHandler}>
          {/* ==================== ISSUE INFORMATION ==================== */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="mb-7">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {t("report.issueSection.title")}
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                {t("report.issueSection.subtitle")}
              </p>
            </div>

            {/* Issue Title */}
            <div className="mb-6">
              <label className="flex text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.title")}
                <span className="text-red-500 ml-1">
                  <Asterisk size={14} />
                </span>
              </label>

              <input
                type="text"
                value={title}
                onChange={(e) => {
                  setTitle(e.target.value);
                  clearError("title");
                }}
                placeholder={t("report.fields.titlePlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm"
              />
              {fieldError("title")}
            </div>

            {/* Category */}
            <div className="mb-6">
              <label className="flex text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.category")}
                <span className="text-red-500 ml-1">
                  <Asterisk size={14} />
                </span>
              </label>

              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  clearError("category");
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg bg-white text-gray-700 outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition cursor-pointer"
              >
                <option value="" disabled>
                  {t("report.fields.categoryPlaceholder")}
                </option>

                {CATEGORIES.map((item) => (
                  <option
                    key={item.value}
                    value={item.value}
                    className="cursor-pointer"
                  >
                    {t(`report.categories.${item.value}`, {
                      defaultValue: item.label,
                    })}
                  </option>
                ))}
              </select>
              {fieldError("category")}
            </div>

            {/* Description */}
            <div className="mb-6">
              <label className="flex text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.description")}
                <span className="text-red-500 ml-1">
                  <Asterisk size={14} />
                </span>
              </label>

              <textarea
                rows={5}
                placeholder={t("report.fields.descriptionPlaceholder")}
                value={description}
                onChange={(e) => {
                  setDescription(e.target.value);
                  clearError("description");
                }}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm"
              ></textarea>

              {fieldError("description")}

              <p className="text-xs text-gray-400 mt-2">
                {t("report.fields.charLimit")}
              </p>
            </div>

            {/* Image Upload */}
            <div>
              <label className="flex text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.photo")}
                <span className="text-red-500 ml-1">
                  <Asterisk size={14} />
                </span>
              </label>

              <div className="w-full min-h-[300px] border-2 border-dashed border-blue-500 rounded-2xl bg-blue-50/30 flex flex-col justify-center items-center p-6 hover:bg-blue-50 transition">
                <img
                  src={preview || Upload}
                  alt={
                    preview
                      ? t("report.fields.previewAlt")
                      : t("report.fields.uploadAlt")
                  }
                  className="w-28 h-28 object-contain mb-5"
                />

                <input
                  type="file"
                  id="image"
                  ref={fileInputRef}
                  accept="image/png,image/jpeg,image/jpg"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (!file) return;
                    if (file.size > MAX_IMAGE_SIZE) {
                      setImage(null);
                      setErrors((prev) => ({
                        ...prev,
                        image: "imageTooLarge",
                      }));
                      e.target.value = "";
                      return;
                    }
                    setImage(file);
                    clearError("image");
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview(URL.createObjectURL(file));
                  }}
                  className="hidden"
                />
                <label
                  htmlFor="image"
                  className="px-8 py-3 bg-blue-700 text-white rounded-lg font-semibold hover:bg-blue-600 active:scale-95 transition-all shadow-sm cursor-pointer"
                >
                  {t("report.fields.uploadImage")}
                </label>

                <p className="text-sm text-gray-500 mt-4">
                  {t("report.fields.fileHint")}
                </p>

                {image && (
                  <p className="text-sm text-gray-700 font-medium mt-3 break-all">
                    {image.name}{" "}
                    {t("report.fields.fileSize", {
                      size: (image.size / 1024 / 1024).toFixed(2),
                    })}
                  </p>
                )}

                {fieldError("image")}

                {preview && (
                  <button
                    type="button"
                    onClick={() => {
                      URL.revokeObjectURL(preview);
                      setPreview("");
                      setImage(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="mt-3 text-sm text-red-600 underline cursor-pointer"
                  >
                    {t("report.fields.removeImage")}
                  </button>
                )}

                <p className="text-xs text-gray-400 mt-1">
                  {t("report.fields.photoHint")}
                </p>
              </div>
            </div>
          </section>

          {/* ==================== LOCATION INFORMATION ==================== */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="mb-7">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {t("report.locationSection.title")}
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                {t("report.locationSection.subtitle")}
              </p>
            </div>

            {/* Address */}
            <div className="mb-6">
              <label className="flex text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.address")}
                <span className="text-red-500 ml-1">
                  <Asterisk size={14} />
                </span>
              </label>

              <input
                type="text"
                value={address}
                onChange={(e) => {
                  setAddress(e.target.value);
                  clearError("address");
                }}
                placeholder={t("report.fields.addressPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm"
              />
              {fieldError("address")}
            </div>

            {/* Use Location */}
            <div className="mb-6">
              <button
                type="button"
                onClick={() => {
                  navigator.geolocation.getCurrentPosition(
                    (position) => {
                      setLatitude(position.coords.latitude);
                      setLongitude(position.coords.longitude);
                    },
                    () => {
                      setErrorMsg(t("report.errors.geoFailed"));
                    },
                  );
                }}
                className="w-full flex cursor-pointer gap-3  md:w-auto px-6 py-3 border-2 border-blue-600 text-blue-600 rounded-lg font-semibold hover:bg-blue-600 hover:text-white transition hover:border-black"
              >
                <span>
                  <MapPin />
                </span>
                {t("report.fields.useMyLocation")}
              </button>

              <p className="text-xs text-gray-400 mt-2">
                {t("report.fields.locationPermissionHint")}
              </p>
            </div>

            {/* Latitude and Longitude */}
            <div className="mb-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2">
                  {t("report.fields.latitude")}
                </label>

                <input
                  type="number"
                  step="any"
                  value={latitude ?? ""}
                  onChange={(e) =>
                    setLatitude(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  placeholder="27.7172"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm"
                />
              </div>

              <div>
                <label className="flex text-sm font-semibold text-gray-700 mb-2">
                  {t("report.fields.longitude")}
                </label>

                <input
                  type="number"
                  step="any"
                  value={longitude ?? ""}
                  onChange={(e) =>
                    setLongitude(
                      e.target.value === "" ? null : Number(e.target.value),
                    )
                  }
                  placeholder="85.3240"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm"
                />
              </div>
            </div>

            {/* Location Status */}
            {/* Only once a point actually exists, otherwise it claims a
                location was detected before the button was ever pressed */}
            {latitude != null && longitude != null && (
              <div className="p-4 rounded-lg bg-green-50 border border-green-200 flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center font-bold">
                  <Check />
                </div>

                <div>
                  <p className="text-sm font-semibold text-green-700">
                    {t("report.fields.locationDetected")}
                  </p>

                  <p className="text-xs text-green-600">
                    {t("report.fields.locationDetectedHint")}
                  </p>
                </div>
              </div>
            )}

            {/* Location Preview */}
            <div className="mt-6">
              <p className="text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.mapPreview")}
              </p>

              <div className="h-48 md:h-64 rounded-xl overflow-hidden border border-gray-200">
                <MapContainer
                  center={[latitude ?? 27.7172, longitude ?? 85.3240]}
                  zoom={15}
                  style={{ height: "100%", width: "100%" }}
                >
                  <TileLayer
                    attribution='&copy; OpenStreetMap contributors'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <RecenterMap
                    latitude={latitude}
                    longitude={longitude}
                  />

                  <LocationMarker
                    setLatitude={setLatitude}
                    setLongitude={setLongitude}
                  />

                  {latitude != null && longitude != null && (
                    <Marker position={[latitude, longitude]} />
                  )}
                </MapContainer>
              </div>

              <p className="text-xs text-gray-400 mt-2">
                {t("report.fields.mapHint")}
              </p>
            </div>
          </section>

          {/* ==================== REPORTER INFORMATION ==================== */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6 md:p-8">
            <div className="mb-7">
              <h2 className="text-xl md:text-2xl font-bold text-gray-900">
                {t("report.reporterSection.title")}
              </h2>

              <p className="text-sm text-gray-500 mt-2">
                {t("report.reporterSection.subtitle")}
              </p>
            </div>

            {/* Name */}
            <div className="mb-6">
              <label className="flex text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.fullName")}
                <span className="text-red-500 ml-1">
                  <Asterisk size={14} />
                </span>
              </label>

              <input
                type="text"
                value={name}
                onChange={(e) => {
                  setName(e.target.value);
                  clearError("name");
                }}
                placeholder={t("report.fields.fullNamePlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm"
              />
              {fieldError("name")}
            </div>

            {/* Email */}
            <div className="mb-6">
              <label className="flex text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.email")}
                <span className="text-red-500 ml-1">
                  <Asterisk size={14} />
                </span>
              </label>

              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  clearError("email");
                }}
                placeholder={t("report.fields.emailPlaceholder")}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm"
              />
              {fieldError("email")}
            </div>

            {/* Phone */}
            <div className="mb-6">
              <label className="flex text-sm font-semibold text-gray-700 mb-2">
                {t("report.fields.phone")}
                <span className="text-red-500 ml-1">
                  <Asterisk size={14} />
                </span>
              </label>

              <input
                type="tel"
                value={phone}
                onChange={(e) => {
                  setPhone(e.target.value);
                  clearError("phone");
                }}
                placeholder={t("report.fields.phonePlaceholder")}
                maxLength={10}
                inputMode="numeric"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg outline-none focus:border-blue-600 focus:ring-2 focus:ring-blue-100 transition placeholder:font-mono placeholder:text-xs sm:placeholder:text-sm"
              />
              {fieldError("phone")}
            </div>

            {/* Privacy Notice */}
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-100 flex gap-3">
              <div className="text-blue-600 text-lg">
                {" "}
                <Lock size={16} />
              </div>

              <div>
                <p className="text-sm font-semibold text-blue-800">
                  {t("report.fields.privacyTitle")}
                </p>

                <p className="text-xs text-blue-600 mt-1 leading-relaxed">
                  {t("report.fields.privacyDescription")}
                </p>
              </div>
            </div>
          </section>

          {/* ==================== SUBMIT ==================== */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <p className="text-sm text-gray-500 text-center sm:text-left">
              {t("report.requiredNote.before")} {" "}
              <span className="text-red-500 inline-flex align-middle">
                <Asterisk size={14} />
              </span>{" "}
              {t("report.requiredNote.after")}
            </p>
            <div>
              {errorMsg && <p className="text-sm text-red-600">{errorMsg}</p>}
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full cursor-pointer sm:w-auto px-10 py-4 bg-blue-700 text-white rounded-xl font-bold hover:bg-blue-600 active:scale-95 transition-all shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? t("report.submit.loading") : t("report.submit.idle")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Report;
