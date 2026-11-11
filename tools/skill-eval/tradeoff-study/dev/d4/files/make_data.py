import random
random.seed(3)
with open("orders.csv", "w", encoding="utf-8") as f:
    f.write("order_id,customer,sku,qty,price\n")
    for i in range(2000):
        f.write(f"o{i:05d},c{random.randrange(300):03d},sku{random.randrange(120):03d},{random.randrange(1,6)},{random.randrange(500,90000)/100:.2f}\n")
