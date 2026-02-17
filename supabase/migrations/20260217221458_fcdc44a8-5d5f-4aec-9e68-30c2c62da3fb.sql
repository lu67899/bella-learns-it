
INSERT INTO public.user_roles (user_id, role)
VALUES ('0a95e56b-2205-4f21-a718-c9c187a3ec55', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;
