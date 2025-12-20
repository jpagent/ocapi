defmodule FizzBuzz do
  def run(n) when n > 0 do
    1..n
    |> Enum.map(&fizzbuzz/1)
    |> Enum.join("\n")
    |> IO.puts()
  end

  defp fizzbuzz(number) do
    cond do
      rem(number, 15) == 0 -> "FizzBuzz"
      rem(number, 3) == 0 -> "Fizz"
      rem(number, 5) == 0 -> "Buzz"
      true -> to_string(number)
    end
  end
end

FizzBuzz.run(100)