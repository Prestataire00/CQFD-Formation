--
-- PostgreSQL database dump
--

\restrict FhQ3srvTSNIa4IHj8nDcSzWgHOzaedUpl5qEWgevDhvTp0DZU9xk5s5SY12ugCf

-- Dumped from database version 16.10
-- Dumped by pg_dump version 16.10

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: drizzle; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA drizzle;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: __drizzle_migrations; Type: TABLE; Schema: drizzle; Owner: -
--

CREATE TABLE drizzle.__drizzle_migrations (
    id integer NOT NULL,
    hash text NOT NULL,
    created_at bigint
);


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE; Schema: drizzle; Owner: -
--

CREATE SEQUENCE drizzle.__drizzle_migrations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE OWNED BY; Schema: drizzle; Owner: -
--

ALTER SEQUENCE drizzle.__drizzle_migrations_id_seq OWNED BY drizzle.__drizzle_migrations.id;


--
-- Name: attendance_records; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.attendance_records (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    session_id integer NOT NULL,
    participant_id integer NOT NULL,
    is_present boolean DEFAULT false NOT NULL,
    signed_at timestamp without time zone
);


--
-- Name: attendance_records_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.attendance_records_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: attendance_records_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.attendance_records_id_seq OWNED BY public.attendance_records.id;


--
-- Name: audit_logs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.audit_logs (
    id integer NOT NULL,
    user_id character varying,
    action text NOT NULL,
    entity_type text NOT NULL,
    entity_id text,
    details jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.audit_logs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: audit_logs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.audit_logs_id_seq OWNED BY public.audit_logs.id;


--
-- Name: badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.badges (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    description text,
    icon character varying(255),
    criteria jsonb,
    created_at timestamp without time zone DEFAULT now(),
    category character varying(255) DEFAULT 'general'::character varying,
    rarity character varying(255) DEFAULT 'common'::character varying,
    condition text DEFAULT ''::text,
    condition_type character varying(255) DEFAULT 'missions_count'::character varying,
    condition_value integer DEFAULT 1,
    xp_reward integer DEFAULT 0,
    is_active boolean DEFAULT true NOT NULL
);


--
-- Name: badges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.badges_id_seq OWNED BY public.badges.id;


--
-- Name: client_contracts; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_contracts (
    id integer NOT NULL,
    contract_number text NOT NULL,
    client_id integer NOT NULL,
    title text NOT NULL,
    description text,
    content text,
    amount integer NOT NULL,
    vat_rate integer DEFAULT 20,
    vat_amount integer,
    total_amount integer,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    signed_at timestamp without time zone,
    pdf_url text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: client_contracts_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_contracts_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_contracts_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_contracts_id_seq OWNED BY public.client_contracts.id;


--
-- Name: client_invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.client_invoices (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    client_id integer NOT NULL,
    contract_id integer,
    mission_id integer,
    title text NOT NULL,
    description text,
    line_items jsonb,
    subtotal integer NOT NULL,
    vat_rate integer DEFAULT 20,
    vat_amount integer,
    total_amount integer NOT NULL,
    invoice_date timestamp without time zone DEFAULT now(),
    due_date timestamp without time zone,
    status text DEFAULT 'draft'::text NOT NULL,
    paid_at timestamp without time zone,
    payment_method text,
    payment_reference text,
    pdf_url text,
    notes text,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: client_invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.client_invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: client_invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.client_invoices_id_seq OWNED BY public.client_invoices.id;


--
-- Name: clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.clients (
    id integer NOT NULL,
    name text NOT NULL,
    email text,
    phone text,
    address text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    type text DEFAULT 'entreprise'::text,
    siret text,
    city text,
    postal_code text,
    contact_name text,
    contact_email text,
    contact_phone text,
    demand text,
    contract_status text DEFAULT 'negotiation'::text NOT NULL,
    contract_amount integer DEFAULT 0,
    assigned_trainer_id text
);


--
-- Name: clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.clients_id_seq OWNED BY public.clients.id;


--
-- Name: company_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.company_settings (
    id integer NOT NULL,
    company_name text NOT NULL,
    legal_form text,
    siret text,
    tva_number text,
    address text,
    city text,
    postal_code text,
    phone text,
    email text,
    website text,
    bank_name text,
    iban text,
    bic text,
    logo_url text,
    invoice_prefix text DEFAULT 'FAC'::text,
    contract_prefix text DEFAULT 'CTR'::text,
    invoice_footer text,
    contract_footer text,
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: company_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.company_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: company_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.company_settings_id_seq OWNED BY public.company_settings.id;


--
-- Name: document_template_versions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_template_versions (
    id integer NOT NULL,
    template_id integer NOT NULL,
    version integer NOT NULL,
    url text NOT NULL,
    uploaded_by character varying,
    change_notes text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: document_template_versions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_template_versions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_template_versions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_template_versions_id_seq OWNED BY public.document_template_versions.id;


--
-- Name: document_templates; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.document_templates (
    id integer NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    for_role text NOT NULL,
    url text NOT NULL,
    description text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    version integer DEFAULT 1 NOT NULL,
    client_id integer
);


--
-- Name: document_templates_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.document_templates_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: document_templates_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.document_templates_id_seq OWNED BY public.document_templates.id;


--
-- Name: documents; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.documents (
    id integer NOT NULL,
    title text NOT NULL,
    type text NOT NULL,
    url text NOT NULL,
    mission_id integer,
    user_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    template_id integer
);


--
-- Name: documents_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.documents_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: documents_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.documents_id_seq OWNED BY public.documents.id;


--
-- Name: evaluations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.evaluations (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    participant_id integer,
    evaluator_id character varying,
    overall_rating integer,
    comments text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: evaluations_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.evaluations_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: evaluations_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.evaluations_id_seq OWNED BY public.evaluations.id;


--
-- Name: feedback_questionnaires; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_questionnaires (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'draft'::text NOT NULL,
    generated_by_ai boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: feedback_questionnaires_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_questionnaires_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_questionnaires_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_questionnaires_id_seq OWNED BY public.feedback_questionnaires.id;


--
-- Name: feedback_questions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_questions (
    id integer NOT NULL,
    questionnaire_id integer NOT NULL,
    question_text text NOT NULL,
    question_type text DEFAULT 'rating'::text NOT NULL,
    options jsonb,
    "order" integer NOT NULL,
    is_required boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: feedback_questions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_questions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_questions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_questions_id_seq OWNED BY public.feedback_questions.id;


--
-- Name: feedback_response_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_response_tokens (
    id integer NOT NULL,
    questionnaire_id integer NOT NULL,
    participant_id integer NOT NULL,
    token character varying NOT NULL,
    sent_at timestamp without time zone,
    sent_via text,
    completed_at timestamp without time zone,
    expires_at timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: feedback_response_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_response_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_response_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_response_tokens_id_seq OWNED BY public.feedback_response_tokens.id;


--
-- Name: feedback_responses; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.feedback_responses (
    id integer NOT NULL,
    token_id integer NOT NULL,
    question_id integer NOT NULL,
    rating_value integer,
    text_value text,
    selected_options jsonb,
    boolean_value boolean,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: feedback_responses_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.feedback_responses_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: feedback_responses_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.feedback_responses_id_seq OWNED BY public.feedback_responses.id;


--
-- Name: in_app_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.in_app_notifications (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    mission_id integer,
    reminder_id integer,
    is_read boolean DEFAULT false NOT NULL,
    read_at timestamp without time zone,
    metadata jsonb,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: in_app_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.in_app_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: in_app_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.in_app_notifications_id_seq OWNED BY public.in_app_notifications.id;


--
-- Name: invoices; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.invoices (
    id integer NOT NULL,
    invoice_number text NOT NULL,
    amount integer NOT NULL,
    status text DEFAULT 'draft'::text NOT NULL,
    rejection_reason text,
    paid_date timestamp without time zone,
    user_id character varying,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    mission_id integer,
    vat_amount integer,
    invoice_date timestamp without time zone
);


--
-- Name: invoices_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.invoices_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: invoices_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.invoices_id_seq OWNED BY public.invoices.id;


--
-- Name: messages; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.messages (
    id integer NOT NULL,
    content text NOT NULL,
    sender_id character varying,
    mission_id integer,
    project_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: messages_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.messages_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: messages_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.messages_id_seq OWNED BY public.messages.id;


--
-- Name: mission_clients; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_clients (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    client_id integer NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: mission_clients_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mission_clients_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mission_clients_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mission_clients_id_seq OWNED BY public.mission_clients.id;


--
-- Name: mission_participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_participants (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    participant_id integer NOT NULL,
    status text DEFAULT 'registered'::text NOT NULL,
    registered_at timestamp without time zone DEFAULT now(),
    convocation_sent_at timestamp without time zone,
    attendance_validated boolean DEFAULT false,
    certificate_generated_at timestamp without time zone,
    positioning_questionnaire_sent_at timestamp without time zone,
    positioning_questionnaire_received_at timestamp without time zone,
    evaluation_sent_at timestamp without time zone,
    evaluation_received_at timestamp without time zone
);


--
-- Name: mission_participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mission_participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mission_participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mission_participants_id_seq OWNED BY public.mission_participants.id;


--
-- Name: mission_sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_sessions (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    session_date timestamp without time zone NOT NULL,
    start_time text,
    end_time text,
    location text
);


--
-- Name: mission_sessions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mission_sessions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mission_sessions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mission_sessions_id_seq OWNED BY public.mission_sessions.id;


--
-- Name: mission_steps; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_steps (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'todo'::text NOT NULL,
    "order" integer NOT NULL,
    due_date timestamp without time zone,
    updated_at timestamp without time zone DEFAULT now(),
    is_completed boolean DEFAULT false NOT NULL,
    comment text,
    created_at timestamp without time zone DEFAULT now(),
    assignee_id character varying,
    comment_author_id character varying,
    comment_updated_at timestamp without time zone
);


--
-- Name: mission_steps_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mission_steps_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mission_steps_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mission_steps_id_seq OWNED BY public.mission_steps.id;


--
-- Name: mission_trainers; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.mission_trainers (
    id integer NOT NULL,
    mission_id integer NOT NULL,
    trainer_id character varying NOT NULL,
    is_primary boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: mission_trainers_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.mission_trainers_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: mission_trainers_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.mission_trainers_id_seq OWNED BY public.mission_trainers.id;


--
-- Name: missions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.missions (
    id integer NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'confirmed'::text NOT NULL,
    start_date timestamp without time zone,
    end_date timestamp without time zone,
    trainer_id character varying,
    client_id integer,
    program_id integer,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    reference text,
    description text,
    location_city text,
    location_address text,
    daily_rate integer,
    typology text DEFAULT 'Intra'::text NOT NULL,
    location text,
    location_type text DEFAULT 'presentiel'::text,
    total_hours integer,
    parent_mission_id integer,
    is_original boolean DEFAULT true NOT NULL,
    program_title text
);


--
-- Name: missions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.missions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: missions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.missions_id_seq OWNED BY public.missions.id;


--
-- Name: participants; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.participants (
    id integer NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    email text NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    function text,
    client_id integer,
    phone text,
    company text
);


--
-- Name: participants_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.participants_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: participants_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.participants_id_seq OWNED BY public.participants.id;


--
-- Name: password_reset_tokens; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.password_reset_tokens (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    token character varying NOT NULL,
    expires_at timestamp without time zone NOT NULL,
    used boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.password_reset_tokens_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.password_reset_tokens_id_seq OWNED BY public.password_reset_tokens.id;


--
-- Name: personal_notes; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.personal_notes (
    id integer NOT NULL,
    user_id character varying NOT NULL,
    title text NOT NULL,
    content text,
    color text DEFAULT 'default'::text,
    is_pinned boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: personal_notes_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.personal_notes_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: personal_notes_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.personal_notes_id_seq OWNED BY public.personal_notes.id;


--
-- Name: projects; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.projects (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    status text DEFAULT 'active'::text NOT NULL,
    user_id character varying,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: projects_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.projects_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: projects_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.projects_id_seq OWNED BY public.projects.id;


--
-- Name: reminder_settings; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminder_settings (
    id integer NOT NULL,
    name text NOT NULL,
    reminder_type text NOT NULL,
    days_before integer NOT NULL,
    is_active boolean DEFAULT true NOT NULL,
    email_subject text,
    email_template text,
    notify_admin boolean DEFAULT false NOT NULL,
    notify_trainer boolean DEFAULT false NOT NULL,
    notify_client boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: reminder_settings_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reminder_settings_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reminder_settings_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reminder_settings_id_seq OWNED BY public.reminder_settings.id;


--
-- Name: reminders; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.reminders (
    id integer NOT NULL,
    setting_id integer,
    mission_id integer,
    task_id integer,
    scheduled_date timestamp without time zone NOT NULL,
    sent_at timestamp without time zone,
    status text DEFAULT 'pending'::text NOT NULL,
    recipient_type text NOT NULL,
    recipient_email text,
    recipient_name text,
    error_message text,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: reminders_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.reminders_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: reminders_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.reminders_id_seq OWNED BY public.reminders.id;


--
-- Name: sessions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.sessions (
    sid character varying NOT NULL,
    sess jsonb NOT NULL,
    expire timestamp without time zone NOT NULL
);


--
-- Name: step_tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.step_tasks (
    id integer NOT NULL,
    step_id integer NOT NULL,
    title text NOT NULL,
    is_completed boolean DEFAULT false NOT NULL,
    comment text,
    "order" integer NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now()
);


--
-- Name: step_tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.step_tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: step_tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.step_tasks_id_seq OWNED BY public.step_tasks.id;


--
-- Name: tasks; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.tasks (
    id integer NOT NULL,
    title text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    project_id integer,
    assigned_to character varying,
    due_date timestamp without time zone,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: tasks_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.tasks_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: tasks_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.tasks_id_seq OWNED BY public.tasks.id;


--
-- Name: template_notifications; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.template_notifications (
    id integer NOT NULL,
    template_id integer NOT NULL,
    user_id character varying NOT NULL,
    is_read boolean DEFAULT false NOT NULL,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: template_notifications_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.template_notifications_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: template_notifications_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.template_notifications_id_seq OWNED BY public.template_notifications.id;


--
-- Name: training_programs; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.training_programs (
    id integer NOT NULL,
    title text NOT NULL,
    description text,
    duration text,
    is_active boolean DEFAULT true NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    code text,
    type text DEFAULT 'Intra'::text,
    objectives text,
    target_public text,
    prerequisites text,
    skills text,
    pedagogical_methods text,
    recommended_participants integer
);


--
-- Name: training_programs_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.training_programs_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: training_programs_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.training_programs_id_seq OWNED BY public.training_programs.id;


--
-- Name: user_badges; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.user_badges (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    badge_id integer NOT NULL,
    unlocked_at timestamp without time zone DEFAULT now(),
    notified boolean DEFAULT false NOT NULL
);


--
-- Name: user_badges_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.user_badges_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: user_badges_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.user_badges_id_seq OWNED BY public.user_badges.id;


--
-- Name: users; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.users (
    id character varying DEFAULT gen_random_uuid() NOT NULL,
    email character varying,
    first_name character varying,
    last_name character varying,
    profile_image_url character varying,
    role text DEFAULT 'subcontractor'::text NOT NULL,
    created_at timestamp without time zone DEFAULT now(),
    updated_at timestamp without time zone DEFAULT now(),
    password_hash character varying,
    status character varying DEFAULT 'ACTIF'::character varying,
    phone character varying,
    address text,
    siret character varying,
    specialties jsonb,
    daily_rate integer,
    current_level integer DEFAULT 1,
    experience_points integer DEFAULT 0,
    total_xp integer DEFAULT 0,
    level integer DEFAULT 1,
    xp integer DEFAULT 0,
    badges jsonb DEFAULT '[]'::jsonb,
    streak_days integer DEFAULT 0,
    last_activity_date timestamp without time zone
);


--
-- Name: xp_transactions; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.xp_transactions (
    id integer NOT NULL,
    user_id character varying(255) NOT NULL,
    amount integer NOT NULL,
    action_type character varying(255) NOT NULL,
    reason text NOT NULL,
    entity_type character varying(255),
    entity_id integer,
    created_at timestamp without time zone DEFAULT now()
);


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.xp_transactions_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.xp_transactions_id_seq OWNED BY public.xp_transactions.id;


--
-- Name: __drizzle_migrations id; Type: DEFAULT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations ALTER COLUMN id SET DEFAULT nextval('drizzle.__drizzle_migrations_id_seq'::regclass);


--
-- Name: attendance_records id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records ALTER COLUMN id SET DEFAULT nextval('public.attendance_records_id_seq'::regclass);


--
-- Name: audit_logs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs ALTER COLUMN id SET DEFAULT nextval('public.audit_logs_id_seq'::regclass);


--
-- Name: badges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges ALTER COLUMN id SET DEFAULT nextval('public.badges_id_seq'::regclass);


--
-- Name: client_contracts id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts ALTER COLUMN id SET DEFAULT nextval('public.client_contracts_id_seq'::regclass);


--
-- Name: client_invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices ALTER COLUMN id SET DEFAULT nextval('public.client_invoices_id_seq'::regclass);


--
-- Name: clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients ALTER COLUMN id SET DEFAULT nextval('public.clients_id_seq'::regclass);


--
-- Name: company_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings ALTER COLUMN id SET DEFAULT nextval('public.company_settings_id_seq'::regclass);


--
-- Name: document_template_versions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_template_versions ALTER COLUMN id SET DEFAULT nextval('public.document_template_versions_id_seq'::regclass);


--
-- Name: document_templates id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_templates ALTER COLUMN id SET DEFAULT nextval('public.document_templates_id_seq'::regclass);


--
-- Name: documents id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents ALTER COLUMN id SET DEFAULT nextval('public.documents_id_seq'::regclass);


--
-- Name: evaluations id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations ALTER COLUMN id SET DEFAULT nextval('public.evaluations_id_seq'::regclass);


--
-- Name: feedback_questionnaires id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_questionnaires ALTER COLUMN id SET DEFAULT nextval('public.feedback_questionnaires_id_seq'::regclass);


--
-- Name: feedback_questions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_questions ALTER COLUMN id SET DEFAULT nextval('public.feedback_questions_id_seq'::regclass);


--
-- Name: feedback_response_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response_tokens ALTER COLUMN id SET DEFAULT nextval('public.feedback_response_tokens_id_seq'::regclass);


--
-- Name: feedback_responses id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_responses ALTER COLUMN id SET DEFAULT nextval('public.feedback_responses_id_seq'::regclass);


--
-- Name: in_app_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications ALTER COLUMN id SET DEFAULT nextval('public.in_app_notifications_id_seq'::regclass);


--
-- Name: invoices id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices ALTER COLUMN id SET DEFAULT nextval('public.invoices_id_seq'::regclass);


--
-- Name: messages id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages ALTER COLUMN id SET DEFAULT nextval('public.messages_id_seq'::regclass);


--
-- Name: mission_clients id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_clients ALTER COLUMN id SET DEFAULT nextval('public.mission_clients_id_seq'::regclass);


--
-- Name: mission_participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_participants ALTER COLUMN id SET DEFAULT nextval('public.mission_participants_id_seq'::regclass);


--
-- Name: mission_sessions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_sessions ALTER COLUMN id SET DEFAULT nextval('public.mission_sessions_id_seq'::regclass);


--
-- Name: mission_steps id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_steps ALTER COLUMN id SET DEFAULT nextval('public.mission_steps_id_seq'::regclass);


--
-- Name: mission_trainers id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_trainers ALTER COLUMN id SET DEFAULT nextval('public.mission_trainers_id_seq'::regclass);


--
-- Name: missions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.missions ALTER COLUMN id SET DEFAULT nextval('public.missions_id_seq'::regclass);


--
-- Name: participants id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants ALTER COLUMN id SET DEFAULT nextval('public.participants_id_seq'::regclass);


--
-- Name: password_reset_tokens id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens ALTER COLUMN id SET DEFAULT nextval('public.password_reset_tokens_id_seq'::regclass);


--
-- Name: personal_notes id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_notes ALTER COLUMN id SET DEFAULT nextval('public.personal_notes_id_seq'::regclass);


--
-- Name: projects id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects ALTER COLUMN id SET DEFAULT nextval('public.projects_id_seq'::regclass);


--
-- Name: reminder_settings id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_settings ALTER COLUMN id SET DEFAULT nextval('public.reminder_settings_id_seq'::regclass);


--
-- Name: reminders id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders ALTER COLUMN id SET DEFAULT nextval('public.reminders_id_seq'::regclass);


--
-- Name: step_tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_tasks ALTER COLUMN id SET DEFAULT nextval('public.step_tasks_id_seq'::regclass);


--
-- Name: tasks id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks ALTER COLUMN id SET DEFAULT nextval('public.tasks_id_seq'::regclass);


--
-- Name: template_notifications id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_notifications ALTER COLUMN id SET DEFAULT nextval('public.template_notifications_id_seq'::regclass);


--
-- Name: training_programs id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_programs ALTER COLUMN id SET DEFAULT nextval('public.training_programs_id_seq'::regclass);


--
-- Name: user_badges id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges ALTER COLUMN id SET DEFAULT nextval('public.user_badges_id_seq'::regclass);


--
-- Name: xp_transactions id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions ALTER COLUMN id SET DEFAULT nextval('public.xp_transactions_id_seq'::regclass);


--
-- Data for Name: __drizzle_migrations; Type: TABLE DATA; Schema: drizzle; Owner: -
--

COPY drizzle.__drizzle_migrations (id, hash, created_at) FROM stdin;
\.


--
-- Data for Name: attendance_records; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.attendance_records (id, mission_id, session_id, participant_id, is_present, signed_at) FROM stdin;
\.


--
-- Data for Name: audit_logs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.audit_logs (id, user_id, action, entity_type, entity_id, details, created_at) FROM stdin;
\.


--
-- Data for Name: badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.badges (id, name, description, icon, criteria, created_at, category, rarity, condition, condition_type, condition_value, xp_reward, is_active) FROM stdin;
1	Pionnier	Première connexion au CRM	star	\N	2026-01-19 17:20:52.801349	general	common		missions_count	1	0	t
2	Organisateur	Cinq missions créées	calendar	\N	2026-01-19 17:20:52.801349	general	common		missions_count	1	0	t
3	Expert	Dix missions complétées	award	\N	2026-01-19 17:20:52.801349	general	common		missions_count	1	0	t
\.


--
-- Data for Name: client_contracts; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_contracts (id, contract_number, client_id, title, description, content, amount, vat_rate, vat_amount, total_amount, start_date, end_date, status, signed_at, pdf_url, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: client_invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.client_invoices (id, invoice_number, client_id, contract_id, mission_id, title, description, line_items, subtotal, vat_rate, vat_amount, total_amount, invoice_date, due_date, status, paid_at, payment_method, payment_reference, pdf_url, notes, created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.clients (id, name, email, phone, address, is_active, created_at, updated_at, type, siret, city, postal_code, contact_name, contact_email, contact_phone, demand, contract_status, contract_amount, assigned_trainer_id) FROM stdin;
1	TechCorp SAS	\N	\N	\N	t	2026-01-10 23:14:15.35113	2026-01-18 17:31:21.213	entreprise	\N	\N	\N	\N	\N	\N	\N	negotiation	0	5d990f72-b1f3-48af-8688-7d849b054718
3	Faouzi	\N	\N		t	2026-01-13 16:12:55.568977	2026-01-19 21:56:07.287	entreprise								client	0	
2	OPCO Commerce	\N	\N	50 avenue des OPCO	t	2026-01-10 23:14:15.353911	2026-01-19 21:56:37.866	entreprise								prospect	0	
4	Anissa Fiévé	\N	\N	\N	t	2026-01-18 16:31:52.406018	2026-01-18 18:00:43.389	entreprise	\N	Lille	\N	Anissa Fiévé	ani2saaa.aaa@gmail.com	0767758580	crm complet	client	0	\N
\.


--
-- Data for Name: company_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.company_settings (id, company_name, legal_form, siret, tva_number, address, city, postal_code, phone, email, website, bank_name, iban, bic, logo_url, invoice_prefix, contract_prefix, invoice_footer, contract_footer, updated_at) FROM stdin;
1	Votre Entreprise	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	\N	FAC	CTR	\N	\N	2026-01-20 18:47:25.171412
\.


--
-- Data for Name: document_template_versions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_template_versions (id, template_id, version, url, uploaded_by, change_notes, created_at) FROM stdin;
4	7	1	/uploads/1769110461259-769296871-SALARIE inter.docx	\N	Version initiale	2026-01-22 19:34:21.534567
5	8	1	/uploads/1769110534019-126394004-PRESTATAIRE intra.docx	\N	Version initiale	2026-01-22 19:35:34.024907
6	9	1	/uploads/1769110599233-30991183-Cahier_des_Charges_CRM_CQFD.docx	\N	Version initiale	2026-01-22 19:36:39.705168
\.


--
-- Data for Name: document_templates; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.document_templates (id, title, type, for_role, url, description, is_active, created_at, updated_at, version, client_id) FROM stdin;
7	Consignes Salarié inter 	Consigne	formateur	/uploads/1769110461259-769296871-SALARIE inter.docx	\N	t	2026-01-22 19:34:21.403289	2026-01-22 19:34:21.403289	1	\N
8	Consigne Prestataire intra 	Consigne	formateur	/uploads/1769110534019-126394004-PRESTATAIRE intra.docx	\N	t	2026-01-22 19:35:34.020937	2026-01-22 19:35:34.020937	1	\N
9	Cahier des charges 	Cahier des charges	formateur	/uploads/1769110599233-30991183-Cahier_des_Charges_CRM_CQFD.docx	\N	t	2026-01-22 19:36:39.670818	2026-01-22 19:36:39.670818	1	\N
\.


--
-- Data for Name: documents; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.documents (id, title, type, url, mission_id, user_id, created_at, template_id) FROM stdin;
15	Programme	Programme		3	admin-001	2026-01-13 10:48:25.512479	\N
56	Cahier des charges	cahier_charges		21	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 20:06:06.908022	2
57	Bonnes pratiques	bonnes_pratiques		21	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 20:06:06.913146	3
58	Cahier des Charges Prestataire (INTRA)	cahier_charges	attached_assets/PRESTATAIRE_intra_1768502193977.docx	21	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 20:06:06.922069	6
23	Cahier des charges	cahier_charges		8	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-13 16:05:38.236972	2
24	Bonnes pratiques	bonnes_pratiques		8	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-13 16:05:38.240519	3
59	Cahier des charges	cahier_charges		22	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-20 19:48:56.960047	2
36	Consignes formateurs	consignes_formateurs		16	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	2026-01-14 09:25:23.649003	1
42	Cahier des charges	cahier_charges		19	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 18:28:48.018023	2
43	Bonnes pratiques	bonnes_pratiques		19	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 18:28:48.02384	3
44	Cahier des charges	cahier_charges		8	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 18:35:15.384923	2
45	Bonnes pratiques	bonnes_pratiques		8	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 18:35:15.391378	3
46	Consignes formateurs	consignes_formateurs		19	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	2026-01-15 19:55:56.769397	1
47	Consignes Formateur Salarié (INTER)	consignes_formateurs	attached_assets/SALARIE_inter_1768502193976.docx	19	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	2026-01-15 19:55:56.773527	5
48	Consignes formateurs	consignes_formateurs		19	formateur-001	2026-01-15 19:55:56.79375	1
49	Consignes Formateur Salarié (INTER)	consignes_formateurs	attached_assets/SALARIE_inter_1768502193976.docx	19	formateur-001	2026-01-15 19:55:56.797089	5
53	Cahier des charges	cahier_charges		21	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 20:05:48.02042	2
54	Bonnes pratiques	bonnes_pratiques		21	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 20:05:48.025386	3
55	Cahier des Charges Prestataire (INTRA)	cahier_charges	attached_assets/PRESTATAIRE_intra_1768502193977.docx	21	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-15 20:05:48.029175	6
60	Bonnes pratiques	bonnes_pratiques		22	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-20 19:48:56.965004	3
61	Cahier des Charges Prestataire (INTRA)	cahier_charges	attached_assets/PRESTATAIRE_intra_1768502193977.docx	22	5d990f72-b1f3-48af-8688-7d849b054718	2026-01-20 19:48:56.969492	6
\.


--
-- Data for Name: evaluations; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.evaluations (id, mission_id, participant_id, evaluator_id, overall_rating, comments, created_at) FROM stdin;
\.


--
-- Data for Name: feedback_questionnaires; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback_questionnaires (id, mission_id, title, description, status, generated_by_ai, created_at, updated_at) FROM stdin;
1	19	Questionnaire de satisfaction - dfddfdd	Merci de prendre quelques minutes pour evaluer cette formation. Vos retours nous aident a ameliorer nos services.	active	t	2026-01-20 10:36:19.564733	2026-01-20 10:36:19.564733
2	22	Questionnaire de satisfaction - Mission 2	Merci de prendre quelques minutes pour evaluer cette formation. Vos retours nous aident a ameliorer nos services.	active	t	2026-01-21 10:40:59.989673	2026-01-21 10:40:59.989673
\.


--
-- Data for Name: feedback_questions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback_questions (id, questionnaire_id, question_text, question_type, options, "order", is_required, created_at) FROM stdin;
1	1	Comment evaluez-vous la qualite globale de cette formation ?	rating	\N	1	t	2026-01-20 10:36:19.569174
2	1	Le contenu de la formation correspondait-il a vos attentes ?	rating	\N	2	t	2026-01-20 10:36:19.573291
3	1	Comment evaluez-vous la clarte des explications du formateur ?	rating	\N	3	t	2026-01-20 10:36:19.576754
4	1	Le formateur etait-il a l'ecoute et disponible pour repondre a vos questions ?	yes_no	\N	4	t	2026-01-20 10:36:19.580142
5	1	Les supports pedagogiques (documents, presentations) etaient-ils adaptes ?	rating	\N	5	t	2026-01-20 10:36:19.584225
6	1	La duree de la formation etait-elle adaptee au contenu ?	multiple_choice	["Trop courte", "Adaptee", "Trop longue"]	6	t	2026-01-20 10:36:19.58847
7	1	Pensez-vous pouvoir appliquer les connaissances acquises dans votre travail quotidien ?	yes_no	\N	7	t	2026-01-20 10:36:19.592235
8	1	Recommanderiez-vous cette formation a un collegue ?	yes_no	\N	8	t	2026-01-20 10:36:19.596385
9	1	Quels sont les points forts de cette formation ?	text	\N	9	f	2026-01-20 10:36:19.603044
10	1	Quelles ameliorations suggereriez-vous pour cette formation ?	text	\N	10	f	2026-01-20 10:36:19.606541
11	2	Comment evaluez-vous la qualite globale de cette formation ?	rating	\N	1	t	2026-01-21 10:41:00.038765
12	2	Le contenu de la formation correspondait-il a vos attentes ?	rating	\N	2	t	2026-01-21 10:41:00.044892
13	2	Comment evaluez-vous la clarte des explications du formateur ?	rating	\N	3	t	2026-01-21 10:41:00.049319
14	2	Le formateur etait-il a l'ecoute et disponible pour repondre a vos questions ?	yes_no	\N	4	t	2026-01-21 10:41:00.062196
15	2	Les supports pedagogiques (documents, presentations) etaient-ils adaptes ?	rating	\N	5	t	2026-01-21 10:41:00.065961
16	2	La duree de la formation etait-elle adaptee au contenu ?	multiple_choice	["Trop courte", "Adaptee", "Trop longue"]	6	t	2026-01-21 10:41:00.07044
17	2	Pensez-vous pouvoir appliquer les connaissances acquises dans votre travail quotidien ?	yes_no	\N	7	t	2026-01-21 10:41:00.07403
18	2	Recommanderiez-vous cette formation a un collegue ?	yes_no	\N	8	t	2026-01-21 10:41:00.077451
19	2	Quels sont les points forts de cette formation ?	text	\N	9	f	2026-01-21 10:41:00.080686
20	2	Quelles ameliorations suggereriez-vous pour cette formation ?	text	\N	10	f	2026-01-21 10:41:00.084146
\.


--
-- Data for Name: feedback_response_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback_response_tokens (id, questionnaire_id, participant_id, token, sent_at, sent_via, completed_at, expires_at, created_at) FROM stdin;
2	1	1	753237d97290fa8d268e85467c8d367d2bf91d0a091ec8c09c83828f927da191	\N	qr_code	\N	2026-02-19 10:37:13.858	2026-01-20 10:37:13.859442
1	1	3	58a3e1df145f7395d5f0fe3ef3b0517b181e78562f59fcd704ce9c6a54bc9b34	2026-01-20 10:36:31.987	email	2026-01-20 10:38:29.679	2026-02-19 10:36:31.987	2026-01-20 10:36:31.987746
3	2	3	35d56f93ef9b3232421158c5c67f1f8c454aa1b84dc85eadf1d6ffeb1dd89c35	\N	qr_code	\N	2026-02-20 10:41:18.454	2026-01-21 10:41:18.455272
\.


--
-- Data for Name: feedback_responses; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.feedback_responses (id, token_id, question_id, rating_value, text_value, selected_options, boolean_value, created_at) FROM stdin;
1	1	1	5	\N	\N	\N	2026-01-20 10:38:29.643386
2	1	2	5	\N	\N	\N	2026-01-20 10:38:29.648388
3	1	3	5	\N	\N	\N	2026-01-20 10:38:29.653097
4	1	4	\N	\N	\N	t	2026-01-20 10:38:29.656668
5	1	5	5	\N	\N	\N	2026-01-20 10:38:29.660633
6	1	6	\N	\N	["Adaptee"]	\N	2026-01-20 10:38:29.664739
7	1	7	\N	\N	\N	t	2026-01-20 10:38:29.667996
8	1	8	\N	\N	\N	t	2026-01-20 10:38:29.67116
9	1	9	\N	Trop bien	\N	\N	2026-01-20 10:38:29.673745
10	1	10	\N	Aucune suggestion 	\N	\N	2026-01-20 10:38:29.676731
\.


--
-- Data for Name: in_app_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.in_app_notifications (id, user_id, type, title, message, mission_id, reminder_id, is_read, read_at, metadata, created_at) FROM stdin;
2	c638f575-2dc2-462e-9f98-e08c2a02dff4	reminder	Rappel J-2 : dfddfdd	Formation "dfddfdd" prévue le 22 janvier 2026	19	5	f	\N	{"location": null, "startDate": "2026-01-22T00:00:00.000Z", "clientName": "OPCO Commerce", "daysBefore": 2, "trainerName": "Anissa  Fiévee"}	2026-01-20 07:40:46.469941
1	fc6c33f9-0245-4b10-856c-3f4daa45b6b6	reminder	Rappel J-2 : dfddfdd	Formation "dfddfdd" prévue le 22 janvier 2026	19	2	t	2026-01-20 08:49:23.674	{"location": null, "startDate": "2026-01-22T00:00:00.000Z", "clientName": "OPCO Commerce", "daysBefore": 2, "trainerName": "Anissa  Fiévee"}	2026-01-20 07:40:46.414427
3	5d990f72-b1f3-48af-8688-7d849b054718	reminder	Rappel J-1 : dfddfdd	Formation "dfddfdd" prévue le 22 janvier 2026	19	1	t	2026-01-22 17:19:41.748	{"location": null, "startDate": "2026-01-22T00:00:00.000Z", "clientName": "OPCO Commerce", "daysBefore": 1, "trainerName": "Anissa  Fiévee"}	2026-01-21 06:09:44.199622
4	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	reminder	Rappel Fin J-1 : dfddfdd	Formation "dfddfdd" se termine le 28 janvier 2026	19	\N	f	\N	{"clientName": "OPCO Commerce", "daysBefore": 1, "reminderType": "mission_end"}	2026-01-27 11:01:56.929015
5	5d990f72-b1f3-48af-8688-7d849b054718	reminder	Rappel Fin J-1 : dfddfdd	Formation "dfddfdd" se termine le 28 janvier 2026	19	\N	f	\N	{"clientName": "OPCO Commerce", "daysBefore": 1, "reminderType": "mission_end"}	2026-01-27 11:01:56.929015
6	formateur-001	reminder	Rappel Fin J-1 : dfddfdd	Formation "dfddfdd" se termine le 28 janvier 2026	19	\N	f	\N	{"clientName": "OPCO Commerce", "daysBefore": 1, "reminderType": "mission_end"}	2026-01-27 11:01:56.929015
7	c638f575-2dc2-462e-9f98-e08c2a02dff4	reminder	Rappel Fin J-1 : dfddfdd	Formation "dfddfdd" se termine le 28 janvier 2026	19	\N	f	\N	{"clientName": "OPCO Commerce", "daysBefore": 1, "reminderType": "mission_end"}	2026-01-27 11:01:56.929015
8	fc6c33f9-0245-4b10-856c-3f4daa45b6b6	reminder	Rappel Fin J-1 : dfddfdd	Formation "dfddfdd" se termine le 28 janvier 2026	19	\N	t	2026-01-27 11:02:39.463	{"clientName": "OPCO Commerce", "daysBefore": 1, "reminderType": "mission_end"}	2026-01-27 11:01:56.929015
\.


--
-- Data for Name: invoices; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.invoices (id, invoice_number, amount, status, rejection_reason, paid_date, user_id, created_at, updated_at, mission_id, vat_amount, invoice_date) FROM stdin;
1	FAC-2024-001	50000	paid	\N	2026-01-13 16:56:57.399	prestataire-001	2026-01-10 23:14:15.384351	2026-01-13 16:56:57.399	\N	\N	\N
\.


--
-- Data for Name: messages; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.messages (id, content, sender_id, mission_id, project_id, created_at) FROM stdin;
\.


--
-- Data for Name: mission_clients; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mission_clients (id, mission_id, client_id, is_primary, created_at) FROM stdin;
5	21	2	f	2026-01-15 20:05:48.17195
6	22	2	f	2026-01-20 19:48:57.138169
\.


--
-- Data for Name: mission_participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mission_participants (id, mission_id, participant_id, status, registered_at, convocation_sent_at, attendance_validated, certificate_generated_at, positioning_questionnaire_sent_at, positioning_questionnaire_received_at, evaluation_sent_at, evaluation_received_at) FROM stdin;
3	19	3	registered	2026-01-20 10:35:13.353156	\N	f	\N	\N	\N	\N	\N
5	22	3	registered	2026-01-20 19:51:45.410469	\N	f	\N	\N	\N	\N	\N
\.


--
-- Data for Name: mission_sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mission_sessions (id, mission_id, session_date, start_time, end_time, location) FROM stdin;
\.


--
-- Data for Name: mission_steps; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mission_steps (id, mission_id, title, status, "order", due_date, updated_at, is_completed, comment, created_at, assignee_id, comment_author_id, comment_updated_at) FROM stdin;
20	8	gggg	todo	1	\N	2026-01-18 16:44:23.822	t	\N	2026-01-18 16:44:21.600434	\N	\N	\N
19	21	hg	todo	1	\N	2026-01-18 18:04:37.452	t	\N	2026-01-15 20:06:14.480994	\N	\N	\N
4	3	frfr	todo	2	2026-01-07 00:00:00	2026-01-18 19:00:10.814	f	y-y-y	2026-01-13 00:55:15.789516	formateur-001	admin-001	\N
21	19	tache 1	priority	1	2026-01-19 00:00:00	2026-01-20 10:35:54.235	t	\N	2026-01-19 18:26:10.251919	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	\N	\N
23	19	tache 2	todo	2	2026-01-21 00:00:00	2026-01-20 10:35:55.037	t	<ul><li>'e'e'e</li></ul>	2026-01-20 10:34:17.689828	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	fc6c33f9-0245-4b10-856c-3f4daa45b6b6	\N
3	3	bdje	todo	1	2026-01-14 00:00:00	2026-01-13 10:26:23.407	t	'ff\n	2026-01-13 00:44:13.937949	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	admin-001	\N
5	3	frfrfr	todo	3	\N	2026-01-13 14:05:41.066196	f	\N	2026-01-13 14:05:41.066196	\N	\N	\N
24	22	tache 1	todo	1	2026-01-24 00:00:00	2026-01-20 19:51:19.14	f	<ul><li><br></li></ul>	2026-01-20 19:50:52.500071	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	fc6c33f9-0245-4b10-856c-3f4daa45b6b6	\N
\.


--
-- Data for Name: mission_trainers; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.mission_trainers (id, mission_id, trainer_id, is_primary, created_at) FROM stdin;
10	8	5d990f72-b1f3-48af-8688-7d849b054718	t	2026-01-15 18:35:15.343772
11	19	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	f	2026-01-15 19:55:56.739369
12	19	formateur-001	f	2026-01-15 19:55:56.786588
13	21	5d990f72-b1f3-48af-8688-7d849b054718	t	2026-01-15 20:06:06.899512
\.


--
-- Data for Name: missions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.missions (id, title, status, start_date, end_date, trainer_id, client_id, program_id, created_at, updated_at, reference, description, location_city, location_address, daily_rate, typology, location, location_type, total_hours, parent_mission_id, is_original, program_title) FROM stdin;
3	cqfd	in_progress	2026-01-12 00:00:00	2026-01-19 00:00:00	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	2	2	2026-01-12 20:50:07.89845	2026-01-13 14:13:23.901	MIS-2025	dbejhdeuijfor"kflmr"f\n	\N	\N	\N	Conseil	Maroc	presentiel	\N	\N	t	\N
8	Test	completed	2026-01-13 00:00:00	2026-01-15 00:00:00	5d990f72-b1f3-48af-8688-7d849b054718	1	2	2026-01-13 16:05:38.230233	2026-01-18 16:44:24.11	MIS-1768317632758-FIÉ	\N	\N	\N	\N	Intra	\N	distanciel	\N	5	f	\N
22	Mission 2	completed	2026-01-20 00:00:00	2026-01-20 00:00:00	5d990f72-b1f3-48af-8688-7d849b054718	3	1	2026-01-20 19:48:56.931633	2026-01-20 19:52:07.493	MIS-1768938536854		\N	\N	\N	Inter		presentiel	\N	\N	t	\N
21	fao	in_progress	2026-01-15 00:00:00	2026-01-23 00:00:00	5d990f72-b1f3-48af-8688-7d849b054718	3	\N	2026-01-15 20:05:48.010167	2026-01-21 09:32:22.593	MIS-1768507547878	\N	\N	\N	\N	Inter	\N	distanciel	\N	\N	t	\N
16	Anissa	completed	2026-01-14 00:00:00	2026-02-04 00:00:00	cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	3	\N	2026-01-14 09:25:23.631055	2026-01-21 10:09:33.968	MIS-1768382712700-FIÉ	\N	\N	\N	\N	Intra	\N	distanciel	\N	14	f	\N
19	dfddfdd	in_progress	2026-01-22 00:00:00	2026-01-28 00:00:00	5d990f72-b1f3-48af-8688-7d849b054718	2	2	2026-01-15 18:28:47.973051	2026-01-22 19:49:10.401	MIS-1768501725574	demande client \n	\N	\N	\N	Inter		presentiel	\N	\N	t	\N
23	Mission 3	confirmed	2026-01-22 00:00:00	2026-01-24 00:00:00	5d990f72-b1f3-48af-8688-7d849b054718	4	\N	2026-01-22 20:16:49.484188	2026-01-22 20:18:12.742	MIS-1769113009351	\N	\N	\N	\N	Intra	\N	distanciel	\N	\N	t	\N
\.


--
-- Data for Name: participants; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.participants (id, first_name, last_name, email, is_active, created_at, updated_at, function, client_id, phone, company) FROM stdin;
1	Alice	Moreau	alice.moreau@techcorp.fr	t	2026-01-10 23:14:15.373019	2026-01-10 23:14:15.373019	\N	\N	\N	\N
2	Bruno	Petit	bruno.petit@techcorp.fr	t	2026-01-10 23:14:15.375653	2026-01-10 23:14:15.375653	\N	\N	\N	\N
3	Anissa	Fiévé	ani2saaa.aaa@gmail.com	t	2026-01-13 16:43:09.137469	2026-01-13 16:43:09.137469	Chef de projet	\N		
\.


--
-- Data for Name: password_reset_tokens; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.password_reset_tokens (id, user_id, token, expires_at, used, created_at) FROM stdin;
6	5d990f72-b1f3-48af-8688-7d849b054718	0256f087469dd41e288ed948d6ad31dbc2da6299a182657b15af3b265c4a07af	2026-01-25 13:45:23.677	t	2026-01-25 12:45:23.716086
\.


--
-- Data for Name: personal_notes; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.personal_notes (id, user_id, title, content, color, is_pinned, created_at, updated_at) FROM stdin;
1	5d990f72-b1f3-48af-8688-7d849b054718	note 1	sss	yellow	t	2026-01-25 12:10:09.738458	2026-01-25 12:10:18.351
2	5d990f72-b1f3-48af-8688-7d849b054718	note 2		blue	f	2026-01-25 12:10:29.116035	2026-01-25 12:10:29.116035
\.


--
-- Data for Name: projects; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.projects (id, title, description, status, user_id, created_at) FROM stdin;
\.


--
-- Data for Name: reminder_settings; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reminder_settings (id, name, reminder_type, days_before, is_active, email_subject, email_template, notify_admin, notify_trainer, notify_client, created_at, updated_at) FROM stdin;
1	Rappel J-30	mission_start	30	t	Rappel: Formation dans 30 jours	\N	f	t	t	2026-01-13 01:01:46.87518	2026-01-13 01:01:46.87518
2	Rappel J-7	mission_start	7	t	Rappel: Formation dans 7 jours	\N	f	t	t	2026-01-13 01:01:46.87518	2026-01-13 01:01:46.87518
3	Rappel J-1	mission_start	1	t	Rappel: Formation demain	\N	f	t	t	2026-01-13 01:01:46.87518	2026-01-13 01:01:46.87518
4	Rappel Admin J-2	admin_summary	2	t	Recap formation J-2: Details a verifier	\N	t	f	f	2026-01-13 01:01:46.87518	2026-01-13 01:01:46.87518
5	Rappel Fin J-2	mission_end	2	t	Rappel: Formation se termine dans 2 jours	\N	t	t	f	2026-01-27 11:01:08.39299	2026-01-27 11:01:08.39299
6	Rappel Fin J-1	mission_end	1	t	Rappel: Formation se termine demain	\N	t	t	f	2026-01-27 11:01:08.39299	2026-01-27 11:01:08.39299
\.


--
-- Data for Name: reminders; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.reminders (id, setting_id, mission_id, task_id, scheduled_date, sent_at, status, recipient_type, recipient_email, recipient_name, error_message, created_at) FROM stdin;
2	4	19	\N	2026-01-20 00:00:00	2026-01-20 07:40:46.316	sent	admin	ani2saaa.aaa@gmail.com	Anissa Fiévé	\N	2026-01-15 18:39:45.01578
5	4	19	\N	2026-01-20 00:00:00	2026-01-20 07:40:46.316	sent	admin	faouzi.fieve13@gmail.com	Faouzi Fiévé	\N	2026-01-16 08:39:25.040388
1	3	19	\N	2026-01-21 00:00:00	2026-01-21 06:09:44.124	sent	trainer	anissa.fieve@skema.edu	Anissa  Fiévee	\N	2026-01-15 18:39:44.975177
\.


--
-- Data for Name: sessions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.sessions (sid, sess, expire) FROM stdin;
tgm3RDIV9jLDQ3Xd6LkGmT4hUJGTtg79	{"cookie": {"path": "/", "secure": false, "expires": "2026-02-01T12:53:46.747Z", "httpOnly": true, "sameSite": "lax", "originalMaxAge": 604800000}, "passport": {"user": "fc6c33f9-0245-4b10-856c-3f4daa45b6b6"}}	2026-02-03 14:53:26
wBnrET70MwfTPMAa2zr9SVQuI2_yT97Q	{"cookie": {"path": "/", "secure": false, "expires": "2026-01-27T08:55:05.537Z", "httpOnly": true, "originalMaxAge": 604800000}, "passport": {"user": "c638f575-2dc2-462e-9f98-e08c2a02dff4"}}	2026-01-28 10:59:04
\.


--
-- Data for Name: step_tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.step_tasks (id, step_id, title, is_completed, comment, "order", created_at, updated_at) FROM stdin;
\.


--
-- Data for Name: tasks; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.tasks (id, title, status, project_id, assigned_to, due_date, created_at) FROM stdin;
\.


--
-- Data for Name: template_notifications; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.template_notifications (id, template_id, user_id, is_read, created_at) FROM stdin;
\.


--
-- Data for Name: training_programs; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.training_programs (id, title, description, duration, is_active, created_at, updated_at, code, type, objectives, target_public, prerequisites, skills, pedagogical_methods, recommended_participants) FROM stdin;
1	Management d'équipe	Formation aux fondamentaux du management	14	t	2026-01-10 23:14:15.356608	2026-01-10 23:14:15.356608	\N	Intra	\N	\N	\N	\N	\N	\N
2	Sécurité informatique	Sensibilisation à la cybersécurité	7	t	2026-01-10 23:14:15.35928	2026-01-10 23:14:15.35928	\N	Intra	\N	\N	\N	\N	\N	\N
\.


--
-- Data for Name: user_badges; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.user_badges (id, user_id, badge_id, unlocked_at, notified) FROM stdin;
\.


--
-- Data for Name: users; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.users (id, email, first_name, last_name, profile_image_url, role, created_at, updated_at, password_hash, status, phone, address, siret, specialties, daily_rate, current_level, experience_points, total_xp, level, xp, badges, streak_days, last_activity_date) FROM stdin;
cd7c9cf1-e5fa-48a6-880c-ca8442ec9b85	Anissa.fieve23@icloud.com	Anissa	Fiévé	\N	formateur	2026-01-12 14:29:17.763991	2026-01-12 14:29:17.763991	$2b$12$VBmIWF/IUYIyASmAbSzkrelxV3UucTxmQwtLvvHdGmK522vTRyLBG	ACTIF	0767758580	\N	\N	\N	\N	1	0	0	1	0	[]	0	\N
5d990f72-b1f3-48af-8688-7d849b054718	anissa.fieve@skema.edu	Anissa 	Fiévee	\N	prestataire	2026-01-13 14:09:12.591366	2026-01-25 12:47:03.672	$2b$10$58nr8gD4WFCvMiHQh939feNxkiD8trqAngBADLQC2P0US17/yz.be	ACTIF	0767758580	\N	\N	\N	\N	1	0	0	1	0	[]	0	\N
fc6c33f9-0245-4b10-856c-3f4daa45b6b6	ani2saaa.aaa@gmail.com	Anissa	Fiévé	\N	admin	2026-01-13 14:10:07.994086	2026-01-27 14:53:24.625	$2b$10$OenG0Oqe1EV7i49o7o.QU.Awl/pgOeI3.Ka0W0dAqsVOttMVSEDAq	ACTIF	\N	\N	\N	\N	\N	1	0	0	1	0	[]	0	\N
formateur-001	formateur@cqfd-formation.fr	Pierre	Martin	\N	formateur	2026-01-10 23:14:15.344051	2026-01-13 16:33:07.464	$2b$10$KvgvgKOTJ9tU5kYwrjzVRONgvfd1bNm8qriBlnZDWrnVvTtsQGFh.	ACTIF	\N	\N	\N	\N	\N	1	0	0	1	0	[]	0	\N
0b0c0abb-c232-4860-a257-49e645cf9bfa	ani2sa.f23@gmail.com	ff	gg	\N	formateur	2026-01-13 16:47:55.766458	2026-01-15 20:07:11.463	$2b$10$Y7.UYagJ9ynVAb4CjQJLius8eHzn2nZe.yO8xf3ifEZhlzcCyRze.	SUPPRIME	\N	\N	\N	\N	\N	1	0	0	1	0	[]	0	\N
prestataire-001	prestataire@example.com	Jean	Bernard	\N	prestataire	2026-01-10 23:14:15.347969	2026-01-16 08:36:52.086	$2b$12$MdLdSeH4RILvefCVawtknut6n6CglmXHhi7QhKb.t6WFdAII.75.2	INACTIF	\N	\N	\N	\N	\N	1	0	0	1	0	[]	0	\N
c638f575-2dc2-462e-9f98-e08c2a02dff4	faouzi.fieve13@gmail.com	Faouzi	Fiévé	\N	admin	2026-01-16 08:38:19.041779	2026-01-16 08:40:36.15	$2b$10$FscXuIH/lObqB2CV3IccnuFGp3wfr80KuLJfIbN2GEhxVfLrfnciq	ACTIF	\N	\N	\N	\N	\N	1	0	0	1	0	[]	0	\N
admin-001	admin@cqfd-formation.fr	Marie	Dupont	\N	admin	2026-01-10 23:14:15.340341	2026-01-13 16:45:19.167	$2b$12$rYt5Zr0eHW/gPPojWcalUOpaXj7krpe/RbawAuVhv7FsOI4lz6pj6	SUPPRIME	\N	\N	\N	\N	\N	1	0	0	1	0	[]	0	\N
\.


--
-- Data for Name: xp_transactions; Type: TABLE DATA; Schema: public; Owner: -
--

COPY public.xp_transactions (id, user_id, amount, action_type, reason, entity_type, entity_id, created_at) FROM stdin;
1	fc6c33f9-0245-4b10-856c-3f4daa45b6b6	100	mission_completed	Mission complétée: dfddfdd	mission	19	2026-01-20 09:43:23.382434
2	fc6c33f9-0245-4b10-856c-3f4daa45b6b6	100	mission_completed	Mission complétée: dfddfdd	mission	19	2026-01-20 10:35:28.990657
3	fc6c33f9-0245-4b10-856c-3f4daa45b6b6	100	mission_completed	Mission complétée: Mission 2	mission	22	2026-01-20 19:52:07.498361
4	fc6c33f9-0245-4b10-856c-3f4daa45b6b6	100	mission_completed	Mission complétée: Anissa	mission	16	2026-01-21 10:09:33.980213
5	5d990f72-b1f3-48af-8688-7d849b054718	100	mission_completed	Mission complétée: dfddfdd	mission	19	2026-01-22 18:19:51.337856
\.


--
-- Name: __drizzle_migrations_id_seq; Type: SEQUENCE SET; Schema: drizzle; Owner: -
--

SELECT pg_catalog.setval('drizzle.__drizzle_migrations_id_seq', 1, false);


--
-- Name: attendance_records_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.attendance_records_id_seq', 1, false);


--
-- Name: audit_logs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.audit_logs_id_seq', 1, false);


--
-- Name: badges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.badges_id_seq', 3, true);


--
-- Name: client_contracts_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.client_contracts_id_seq', 1, false);


--
-- Name: client_invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.client_invoices_id_seq', 1, false);


--
-- Name: clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.clients_id_seq', 4, true);


--
-- Name: company_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.company_settings_id_seq', 1, true);


--
-- Name: document_template_versions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.document_template_versions_id_seq', 7, true);


--
-- Name: document_templates_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.document_templates_id_seq', 15, true);


--
-- Name: documents_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.documents_id_seq', 61, true);


--
-- Name: evaluations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.evaluations_id_seq', 1, false);


--
-- Name: feedback_questionnaires_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_questionnaires_id_seq', 2, true);


--
-- Name: feedback_questions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_questions_id_seq', 20, true);


--
-- Name: feedback_response_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_response_tokens_id_seq', 3, true);


--
-- Name: feedback_responses_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.feedback_responses_id_seq', 10, true);


--
-- Name: in_app_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.in_app_notifications_id_seq', 8, true);


--
-- Name: invoices_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.invoices_id_seq', 1, true);


--
-- Name: messages_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.messages_id_seq', 1, false);


--
-- Name: mission_clients_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mission_clients_id_seq', 6, true);


--
-- Name: mission_participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mission_participants_id_seq', 5, true);


--
-- Name: mission_sessions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mission_sessions_id_seq', 2, true);


--
-- Name: mission_steps_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mission_steps_id_seq', 24, true);


--
-- Name: mission_trainers_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.mission_trainers_id_seq', 13, true);


--
-- Name: missions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.missions_id_seq', 23, true);


--
-- Name: participants_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.participants_id_seq', 3, true);


--
-- Name: password_reset_tokens_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.password_reset_tokens_id_seq', 6, true);


--
-- Name: personal_notes_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.personal_notes_id_seq', 2, true);


--
-- Name: projects_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.projects_id_seq', 1, false);


--
-- Name: reminder_settings_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reminder_settings_id_seq', 6, true);


--
-- Name: reminders_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.reminders_id_seq', 6, true);


--
-- Name: step_tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.step_tasks_id_seq', 1, true);


--
-- Name: tasks_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.tasks_id_seq', 1, false);


--
-- Name: template_notifications_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.template_notifications_id_seq', 1, false);


--
-- Name: training_programs_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.training_programs_id_seq', 2, true);


--
-- Name: user_badges_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.user_badges_id_seq', 1, false);


--
-- Name: xp_transactions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: -
--

SELECT pg_catalog.setval('public.xp_transactions_id_seq', 5, true);


--
-- Name: __drizzle_migrations __drizzle_migrations_pkey; Type: CONSTRAINT; Schema: drizzle; Owner: -
--

ALTER TABLE ONLY drizzle.__drizzle_migrations
    ADD CONSTRAINT __drizzle_migrations_pkey PRIMARY KEY (id);


--
-- Name: attendance_records attendance_records_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_pkey PRIMARY KEY (id);


--
-- Name: audit_logs audit_logs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);


--
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- Name: client_contracts client_contracts_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_pkey PRIMARY KEY (id);


--
-- Name: client_invoices client_invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_pkey PRIMARY KEY (id);


--
-- Name: clients clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.clients
    ADD CONSTRAINT clients_pkey PRIMARY KEY (id);


--
-- Name: company_settings company_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.company_settings
    ADD CONSTRAINT company_settings_pkey PRIMARY KEY (id);


--
-- Name: document_template_versions document_template_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_template_versions
    ADD CONSTRAINT document_template_versions_pkey PRIMARY KEY (id);


--
-- Name: document_templates document_templates_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_templates
    ADD CONSTRAINT document_templates_pkey PRIMARY KEY (id);


--
-- Name: documents documents_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_pkey PRIMARY KEY (id);


--
-- Name: evaluations evaluations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_pkey PRIMARY KEY (id);


--
-- Name: feedback_questionnaires feedback_questionnaires_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_questionnaires
    ADD CONSTRAINT feedback_questionnaires_pkey PRIMARY KEY (id);


--
-- Name: feedback_questions feedback_questions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_questions
    ADD CONSTRAINT feedback_questions_pkey PRIMARY KEY (id);


--
-- Name: feedback_response_tokens feedback_response_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response_tokens
    ADD CONSTRAINT feedback_response_tokens_pkey PRIMARY KEY (id);


--
-- Name: feedback_response_tokens feedback_response_tokens_token_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response_tokens
    ADD CONSTRAINT feedback_response_tokens_token_unique UNIQUE (token);


--
-- Name: feedback_responses feedback_responses_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_responses
    ADD CONSTRAINT feedback_responses_pkey PRIMARY KEY (id);


--
-- Name: in_app_notifications in_app_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_pkey PRIMARY KEY (id);


--
-- Name: invoices invoices_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_pkey PRIMARY KEY (id);


--
-- Name: messages messages_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_pkey PRIMARY KEY (id);


--
-- Name: mission_clients mission_clients_mission_id_client_id_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_clients
    ADD CONSTRAINT mission_clients_mission_id_client_id_key UNIQUE (mission_id, client_id);


--
-- Name: mission_clients mission_clients_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_clients
    ADD CONSTRAINT mission_clients_pkey PRIMARY KEY (id);


--
-- Name: mission_participants mission_participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_participants
    ADD CONSTRAINT mission_participants_pkey PRIMARY KEY (id);


--
-- Name: mission_sessions mission_sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_sessions
    ADD CONSTRAINT mission_sessions_pkey PRIMARY KEY (id);


--
-- Name: mission_steps mission_steps_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_steps
    ADD CONSTRAINT mission_steps_pkey PRIMARY KEY (id);


--
-- Name: mission_trainers mission_trainers_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_trainers
    ADD CONSTRAINT mission_trainers_pkey PRIMARY KEY (id);


--
-- Name: missions missions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_pkey PRIMARY KEY (id);


--
-- Name: participants participants_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_pkey PRIMARY KEY (id);


--
-- Name: password_reset_tokens password_reset_tokens_token_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_token_key UNIQUE (token);


--
-- Name: personal_notes personal_notes_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_notes
    ADD CONSTRAINT personal_notes_pkey PRIMARY KEY (id);


--
-- Name: projects projects_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_pkey PRIMARY KEY (id);


--
-- Name: reminder_settings reminder_settings_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminder_settings
    ADD CONSTRAINT reminder_settings_pkey PRIMARY KEY (id);


--
-- Name: reminders reminders_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_pkey PRIMARY KEY (id);


--
-- Name: sessions sessions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.sessions
    ADD CONSTRAINT sessions_pkey PRIMARY KEY (sid);


--
-- Name: step_tasks step_tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_tasks
    ADD CONSTRAINT step_tasks_pkey PRIMARY KEY (id);


--
-- Name: tasks tasks_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_pkey PRIMARY KEY (id);


--
-- Name: template_notifications template_notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_notifications
    ADD CONSTRAINT template_notifications_pkey PRIMARY KEY (id);


--
-- Name: training_programs training_programs_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.training_programs
    ADD CONSTRAINT training_programs_pkey PRIMARY KEY (id);


--
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- Name: users users_email_unique; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_email_unique UNIQUE (email);


--
-- Name: users users_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.users
    ADD CONSTRAINT users_pkey PRIMARY KEY (id);


--
-- Name: xp_transactions xp_transactions_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_pkey PRIMARY KEY (id);


--
-- Name: idx_mission_trainers_mission_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mission_trainers_mission_id ON public.mission_trainers USING btree (mission_id);


--
-- Name: idx_mission_trainers_trainer_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX idx_mission_trainers_trainer_id ON public.mission_trainers USING btree (trainer_id);


--
-- Name: personal_notes_user_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX personal_notes_user_id_idx ON public.personal_notes USING btree (user_id);


--
-- Name: attendance_records attendance_records_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: attendance_records attendance_records_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- Name: attendance_records attendance_records_session_id_mission_sessions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.attendance_records
    ADD CONSTRAINT attendance_records_session_id_mission_sessions_id_fk FOREIGN KEY (session_id) REFERENCES public.mission_sessions(id);


--
-- Name: audit_logs audit_logs_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: client_contracts client_contracts_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_contracts
    ADD CONSTRAINT client_contracts_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: client_invoices client_invoices_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: client_invoices client_invoices_contract_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_contract_id_fkey FOREIGN KEY (contract_id) REFERENCES public.client_contracts(id);


--
-- Name: client_invoices client_invoices_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.client_invoices
    ADD CONSTRAINT client_invoices_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: document_template_versions document_template_versions_template_id_document_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_template_versions
    ADD CONSTRAINT document_template_versions_template_id_document_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE CASCADE;


--
-- Name: document_template_versions document_template_versions_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_template_versions
    ADD CONSTRAINT document_template_versions_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE CASCADE;


--
-- Name: document_template_versions document_template_versions_uploaded_by_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_template_versions
    ADD CONSTRAINT document_template_versions_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: document_template_versions document_template_versions_uploaded_by_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_template_versions
    ADD CONSTRAINT document_template_versions_uploaded_by_users_id_fk FOREIGN KEY (uploaded_by) REFERENCES public.users(id);


--
-- Name: document_templates document_templates_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.document_templates
    ADD CONSTRAINT document_templates_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id) ON DELETE CASCADE;


--
-- Name: documents documents_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: documents documents_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.documents
    ADD CONSTRAINT documents_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: evaluations evaluations_evaluator_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_evaluator_id_users_id_fk FOREIGN KEY (evaluator_id) REFERENCES public.users(id);


--
-- Name: evaluations evaluations_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: evaluations evaluations_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.evaluations
    ADD CONSTRAINT evaluations_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- Name: feedback_questionnaires feedback_questionnaires_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_questionnaires
    ADD CONSTRAINT feedback_questionnaires_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: feedback_questions feedback_questions_questionnaire_id_feedback_questionnaires_id_; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_questions
    ADD CONSTRAINT feedback_questions_questionnaire_id_feedback_questionnaires_id_ FOREIGN KEY (questionnaire_id) REFERENCES public.feedback_questionnaires(id);


--
-- Name: feedback_response_tokens feedback_response_tokens_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response_tokens
    ADD CONSTRAINT feedback_response_tokens_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- Name: feedback_response_tokens feedback_response_tokens_questionnaire_id_feedback_questionnair; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_response_tokens
    ADD CONSTRAINT feedback_response_tokens_questionnaire_id_feedback_questionnair FOREIGN KEY (questionnaire_id) REFERENCES public.feedback_questionnaires(id);


--
-- Name: feedback_responses feedback_responses_question_id_feedback_questions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_responses
    ADD CONSTRAINT feedback_responses_question_id_feedback_questions_id_fk FOREIGN KEY (question_id) REFERENCES public.feedback_questions(id);


--
-- Name: feedback_responses feedback_responses_token_id_feedback_response_tokens_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.feedback_responses
    ADD CONSTRAINT feedback_responses_token_id_feedback_response_tokens_id_fk FOREIGN KEY (token_id) REFERENCES public.feedback_response_tokens(id);


--
-- Name: in_app_notifications in_app_notifications_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: in_app_notifications in_app_notifications_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: in_app_notifications in_app_notifications_reminder_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_reminder_id_fkey FOREIGN KEY (reminder_id) REFERENCES public.reminders(id);


--
-- Name: in_app_notifications in_app_notifications_reminder_id_reminders_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_reminder_id_reminders_id_fk FOREIGN KEY (reminder_id) REFERENCES public.reminders(id);


--
-- Name: in_app_notifications in_app_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: in_app_notifications in_app_notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.in_app_notifications
    ADD CONSTRAINT in_app_notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: invoices invoices_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: invoices invoices_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: invoices invoices_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.invoices
    ADD CONSTRAINT invoices_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: messages messages_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: messages messages_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: messages messages_sender_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.messages
    ADD CONSTRAINT messages_sender_id_users_id_fk FOREIGN KEY (sender_id) REFERENCES public.users(id);


--
-- Name: mission_clients mission_clients_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_clients
    ADD CONSTRAINT mission_clients_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: mission_clients mission_clients_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_clients
    ADD CONSTRAINT mission_clients_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: mission_clients mission_clients_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_clients
    ADD CONSTRAINT mission_clients_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: mission_clients mission_clients_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_clients
    ADD CONSTRAINT mission_clients_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: mission_participants mission_participants_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_participants
    ADD CONSTRAINT mission_participants_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: mission_participants mission_participants_participant_id_participants_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_participants
    ADD CONSTRAINT mission_participants_participant_id_participants_id_fk FOREIGN KEY (participant_id) REFERENCES public.participants(id);


--
-- Name: mission_sessions mission_sessions_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_sessions
    ADD CONSTRAINT mission_sessions_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: mission_steps mission_steps_assignee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_steps
    ADD CONSTRAINT mission_steps_assignee_id_fkey FOREIGN KEY (assignee_id) REFERENCES public.users(id);


--
-- Name: mission_steps mission_steps_assignee_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_steps
    ADD CONSTRAINT mission_steps_assignee_id_users_id_fk FOREIGN KEY (assignee_id) REFERENCES public.users(id);


--
-- Name: mission_steps mission_steps_comment_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_steps
    ADD CONSTRAINT mission_steps_comment_author_id_fkey FOREIGN KEY (comment_author_id) REFERENCES public.users(id);


--
-- Name: mission_steps mission_steps_comment_author_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_steps
    ADD CONSTRAINT mission_steps_comment_author_id_users_id_fk FOREIGN KEY (comment_author_id) REFERENCES public.users(id);


--
-- Name: mission_steps mission_steps_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_steps
    ADD CONSTRAINT mission_steps_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: mission_steps mission_steps_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_steps
    ADD CONSTRAINT mission_steps_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: mission_trainers mission_trainers_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_trainers
    ADD CONSTRAINT mission_trainers_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id) ON DELETE CASCADE;


--
-- Name: mission_trainers mission_trainers_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_trainers
    ADD CONSTRAINT mission_trainers_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: mission_trainers mission_trainers_trainer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_trainers
    ADD CONSTRAINT mission_trainers_trainer_id_fkey FOREIGN KEY (trainer_id) REFERENCES public.users(id) ON DELETE CASCADE;


--
-- Name: mission_trainers mission_trainers_trainer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.mission_trainers
    ADD CONSTRAINT mission_trainers_trainer_id_users_id_fk FOREIGN KEY (trainer_id) REFERENCES public.users(id);


--
-- Name: missions missions_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: missions missions_program_id_training_programs_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_program_id_training_programs_id_fk FOREIGN KEY (program_id) REFERENCES public.training_programs(id);


--
-- Name: missions missions_trainer_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.missions
    ADD CONSTRAINT missions_trainer_id_users_id_fk FOREIGN KEY (trainer_id) REFERENCES public.users(id);


--
-- Name: participants participants_client_id_clients_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_client_id_clients_id_fk FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: participants participants_client_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.participants
    ADD CONSTRAINT participants_client_id_fkey FOREIGN KEY (client_id) REFERENCES public.clients(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: password_reset_tokens password_reset_tokens_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.password_reset_tokens
    ADD CONSTRAINT password_reset_tokens_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: personal_notes personal_notes_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.personal_notes
    ADD CONSTRAINT personal_notes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: projects projects_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.projects
    ADD CONSTRAINT projects_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: reminders reminders_mission_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: reminders reminders_mission_id_missions_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_mission_id_missions_id_fk FOREIGN KEY (mission_id) REFERENCES public.missions(id);


--
-- Name: reminders reminders_setting_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_setting_id_fkey FOREIGN KEY (setting_id) REFERENCES public.reminder_settings(id);


--
-- Name: reminders reminders_setting_id_reminder_settings_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_setting_id_reminder_settings_id_fk FOREIGN KEY (setting_id) REFERENCES public.reminder_settings(id);


--
-- Name: reminders reminders_task_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_task_id_fkey FOREIGN KEY (task_id) REFERENCES public.mission_steps(id);


--
-- Name: reminders reminders_task_id_mission_steps_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.reminders
    ADD CONSTRAINT reminders_task_id_mission_steps_id_fk FOREIGN KEY (task_id) REFERENCES public.mission_steps(id);


--
-- Name: step_tasks step_tasks_step_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_tasks
    ADD CONSTRAINT step_tasks_step_id_fkey FOREIGN KEY (step_id) REFERENCES public.mission_steps(id);


--
-- Name: step_tasks step_tasks_step_id_mission_steps_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.step_tasks
    ADD CONSTRAINT step_tasks_step_id_mission_steps_id_fk FOREIGN KEY (step_id) REFERENCES public.mission_steps(id);


--
-- Name: tasks tasks_assigned_to_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_assigned_to_users_id_fk FOREIGN KEY (assigned_to) REFERENCES public.users(id);


--
-- Name: tasks tasks_project_id_projects_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.tasks
    ADD CONSTRAINT tasks_project_id_projects_id_fk FOREIGN KEY (project_id) REFERENCES public.projects(id);


--
-- Name: template_notifications template_notifications_template_id_document_templates_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_notifications
    ADD CONSTRAINT template_notifications_template_id_document_templates_id_fk FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE CASCADE;


--
-- Name: template_notifications template_notifications_template_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_notifications
    ADD CONSTRAINT template_notifications_template_id_fkey FOREIGN KEY (template_id) REFERENCES public.document_templates(id) ON DELETE CASCADE;


--
-- Name: template_notifications template_notifications_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_notifications
    ADD CONSTRAINT template_notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: template_notifications template_notifications_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.template_notifications
    ADD CONSTRAINT template_notifications_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_badges user_badges_badge_id_badges_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_badges_id_fk FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: user_badges user_badges_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: xp_transactions xp_transactions_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- Name: xp_transactions xp_transactions_user_id_users_id_fk; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.xp_transactions
    ADD CONSTRAINT xp_transactions_user_id_users_id_fk FOREIGN KEY (user_id) REFERENCES public.users(id);


--
-- PostgreSQL database dump complete
--

\unrestrict FhQ3srvTSNIa4IHj8nDcSzWgHOzaedUpl5qEWgevDhvTp0DZU9xk5s5SY12ugCf

