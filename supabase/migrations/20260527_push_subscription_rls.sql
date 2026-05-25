-- RLS policies for push_subscription
-- Each socio can only manage their own push subscriptions.

CREATE POLICY "Socios gestionan sus suscripciones push"
  ON push_subscription
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
