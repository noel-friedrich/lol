def rooms_at_distance(distance: int) -> int:
    if distance == 0:
        return 1
    return 4 * 3 ** (distance - 1)

def cumulative_rooms_at_distance(distance: int) -> int:
    sum = 0
    for n in range(distance + 1):
        sum += rooms_at_distance(n)
    return sum

def roomId_from_path(path: list[int]) -> int:
    sum = 0
    factor = 1
    for i in reversed(range(len(path))):
        coefficient = path[i]
        sum += coefficient * factor
        if factor == 1:
            factor *= 4
        else:
            factor *= 3
    return sum

for i in range(10):
    print(i, rooms_at_distance(i))

while 1:
    try:
        path = [int(s) for s in input("$ ").split(",")]
        print(">", roomId_from_path(path), end="\n\n")
    except Exception as e:
        print("E", e)