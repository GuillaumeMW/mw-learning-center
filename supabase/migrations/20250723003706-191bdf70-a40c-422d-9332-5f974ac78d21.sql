-- Update the handle_new_user function to work with new profile schema
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Insert profile with metadata from auth
  INSERT INTO public.profiles (
    user_id, 
    first_name, 
    last_name, 
    phone_number,
    address_line1,
    address_line2,
    city,
    province_state,
    postal_code,
    country,
    employment_status,
    occupation,
    service_regions,
    languages_spoken
  )
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    NEW.raw_user_meta_data ->> 'phone_number',
    NEW.raw_user_meta_data ->> 'address_line1',
    NEW.raw_user_meta_data ->> 'address_line2',
    NEW.raw_user_meta_data ->> 'city',
    NEW.raw_user_meta_data ->> 'province_state',
    NEW.raw_user_meta_data ->> 'postal_code',
    COALESCE(NEW.raw_user_meta_data ->> 'country', 'Canada'),
    COALESCE((NEW.raw_user_meta_data ->> 'employment_status')::public.app_employment_status, 'other'),
    (NEW.raw_user_meta_data ->> 'occupation')::public.app_occupation,
    CASE 
      WHEN NEW.raw_user_meta_data ? 'service_regions' THEN 
        ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'service_regions'))
      ELSE NULL 
    END,
    CASE 
      WHEN NEW.raw_user_meta_data ? 'languages_spoken' THEN 
        ARRAY(SELECT jsonb_array_elements_text(NEW.raw_user_meta_data->'languages_spoken'))
      ELSE NULL 
    END
  );
  
  -- Assign default student role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;