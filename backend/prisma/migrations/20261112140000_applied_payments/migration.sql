-- Durable payment de-dup: a Razorpay payment is applied at most once, ever.
CREATE TABLE "applied_payments" (
    "payment_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_id" TEXT NOT NULL,
    "applied_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "applied_payments_pkey" PRIMARY KEY ("payment_id")
);
CREATE INDEX "applied_payments_user_id_idx" ON "applied_payments"("user_id");
