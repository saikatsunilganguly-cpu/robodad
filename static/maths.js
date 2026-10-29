/* RoboDad maths: Grades 7-10 (roughly following the Ontario curriculum).
   Every explanation and quiz question here is written by hand and checked,
   so the answer key is never made up on the fly. In each question, "ok" is
   the right answer and "no" are the wrong ones; the app shuffles them.
   The "Ask Dad" coach uses the AI, told to give hints first, not answers. */
(function(){
  const T = [
    { id:"integers", grade:7, title:"Integers", short:"negative numbers",
      learn:[
        "Adding a negative is the same as subtracting: 5 + (−3) = 2.",
        "Subtracting a negative is the same as adding: 5 − (−3) = 8.",
        "Multiplying or dividing: same signs give a positive, different signs give a negative.",
        "On a number line, further right is bigger, so −2 is bigger than −7." ],
      ex:{ q:"Work out −4 − (−9).", steps:["Subtracting a negative means adding: −4 + 9.", "Start at −4 and move 9 to the right.", "You land on 5."] },
      tip:"Think of temperature: −2°C is warmer than −7°C. That's why −2 is the bigger number.",
      quiz:[
        { q:"−6 + 10 = ?", ok:"4", no:["−16", "16", "−4"], why:"Start at −6 and move 10 to the right. You land on 4." },
        { q:"3 − 8 = ?", ok:"−5", no:["5", "11", "−11"], why:"Start at 3 and move 8 to the left. You land on −5." },
        { q:"−7 − (−2) = ?", ok:"−5", no:["−9", "5", "9"], why:"Subtracting a negative means adding: −7 + 2 = −5." },
        { q:"(−4) × (−6) = ?", ok:"24", no:["−24", "−10", "10"], why:"Same signs give a positive: 4 × 6 = 24." },
        { q:"−36 ÷ 9 = ?", ok:"−4", no:["4", "−27", "−45"], why:"Different signs give a negative: 36 ÷ 9 = 4, so the answer is −4." },
        { q:"Which number is the biggest?", ok:"−1", no:["−3", "−10", "−100"], why:"On a number line, −1 is furthest to the right." } ] },

    { id:"fractions", grade:7, title:"Fractions", short:"adding and multiplying fractions",
      learn:[
        "To add or subtract fractions, the bottoms (denominators) have to match.",
        "Find a common denominator, then add or subtract the tops (numerators).",
        "Simplify by dividing the top and bottom by the same number.",
        "To multiply, multiply the tops together and the bottoms together." ],
      ex:{ q:"Work out 1/2 + 1/3.", steps:["A common denominator for 2 and 3 is 6.", "1/2 = 3/6 and 1/3 = 2/6.", "3/6 + 2/6 = 5/6."] },
      tip:"Pizza rule: you can only add slices if they're cut the same size. That's all a common denominator is.",
      quiz:[
        { q:"1/4 + 2/4 = ?", ok:"3/4", no:["3/8", "2/16", "1/2"], why:"The bottoms already match, so add the tops: 1 + 2 = 3. That's 3/4." },
        { q:"1/2 + 1/4 = ?", ok:"3/4", no:["2/6", "1/6", "2/4"], why:"1/2 = 2/4, and 2/4 + 1/4 = 3/4." },
        { q:"5/6 − 1/3 = ?", ok:"1/2", no:["4/3", "2/3", "1/6"], why:"1/3 = 2/6, so 5/6 − 2/6 = 3/6, which simplifies to 1/2." },
        { q:"Simplify 8/12.", ok:"2/3", no:["3/4", "4/3", "1/4"], why:"Divide the top and bottom by 4: 8 ÷ 4 = 2 and 12 ÷ 4 = 3." },
        { q:"2/3 × 3/5 = ?", ok:"2/5", no:["5/8", "6/8", "5/15"], why:"Multiply across to get 6/15, then divide top and bottom by 3: 2/5." },
        { q:"Which is bigger: 3/5 or 2/3?", ok:"2/3", no:["3/5", "They're equal", "You can't tell"], why:"3/5 = 9/15 and 2/3 = 10/15, so 2/3 is bigger." } ] },

    { id:"percent", grade:7, title:"Percent", short:"percentages and discounts",
      learn:[
        "Percent means \"out of 100\": 25% = 25/100 = 0.25.",
        "To find a percent of a number, turn the percent into a decimal and multiply: 20% of 50 = 0.2 × 50 = 10.",
        "10% is the easy one: move the decimal point one place left. 10% of 80 = 8.",
        "A discount comes off the price. Tax gets added on." ],
      ex:{ q:"A $40 hoodie is 25% off. What do you pay (before tax)?", steps:["25% of 40 = 0.25 × 40 = 10.", "Take it off the price: 40 − 10 = 30.", "You pay $30."] },
      tip:"Find 10% first, then build from it: double it for 20%, halve it for 5%. Works in your head at the store.",
      quiz:[
        { q:"What is 10% of 70?", ok:"7", no:["0.7", "70", "17"], why:"Move the decimal point one place left: 70 becomes 7." },
        { q:"What is 50% of 36?", ok:"18", no:["72", "3.6", "16"], why:"50% is half: 36 ÷ 2 = 18." },
        { q:"What is 25% of 80?", ok:"20", no:["25", "32", "40"], why:"25% is a quarter: 80 ÷ 4 = 20." },
        { q:"Write 0.35 as a percent.", ok:"35%", no:["3.5%", "0.35%", "350%"], why:"Multiply by 100: 0.35 × 100 = 35%." },
        { q:"A $60 game is 20% off. What's the sale price?", ok:"$48", no:["$12", "$40", "$58"], why:"20% of 60 is 12, and 60 − 12 = 48." },
        { q:"You got 18 out of 20 on a quiz. What percent is that?", ok:"90%", no:["18%", "85%", "80%"], why:"18 ÷ 20 = 0.9, which is 90%." } ] },

    { id:"bedmas", grade:7, title:"Order of operations", short:"BEDMAS",
      learn:[
        "BEDMAS: Brackets, Exponents, Division and Multiplication, Addition and Subtraction.",
        "× and ÷ are equal partners: do whichever comes first, reading left to right. Same for + and −.",
        "Always work inside brackets first, even if there's a + in there." ],
      ex:{ q:"Work out 3 + 4 × 2².", steps:["Exponent first: 2² = 4.", "Then multiply: 4 × 4 = 16.", "Then add: 3 + 16 = 19."] },
      tip:"Do it in BEDMAS order and you'll win every \"viral maths problem\" argument at the dinner table.",
      quiz:[
        { q:"2 + 3 × 4 = ?", ok:"14", no:["20", "24", "9"], why:"Multiply first: 3 × 4 = 12. Then 2 + 12 = 14." },
        { q:"(2 + 3) × 4 = ?", ok:"20", no:["14", "9", "24"], why:"Brackets first: 2 + 3 = 5. Then 5 × 4 = 20." },
        { q:"18 ÷ 3 × 2 = ?", ok:"12", no:["3", "9", "36"], why:"÷ and × go left to right: 18 ÷ 3 = 6, then 6 × 2 = 12." },
        { q:"10 − 2 × 3 + 1 = ?", ok:"5", no:["25", "3", "7"], why:"Multiply first: 2 × 3 = 6. Then left to right: 10 − 6 = 4, and 4 + 1 = 5." },
        { q:"3² + 4 × 2 = ?", ok:"17", no:["26", "14", "50"], why:"Exponent: 3² = 9. Multiply: 4 × 2 = 8. Add: 9 + 8 = 17." },
        { q:"20 − (4 + 6) ÷ 2 = ?", ok:"15", no:["5", "13", "8"], why:"Brackets: 4 + 6 = 10. Divide: 10 ÷ 2 = 5. Subtract: 20 − 5 = 15." } ] },

    { id:"exponents", grade:8, title:"Exponents and square roots", short:"powers and square roots",
      learn:[
        "An exponent says how many times to multiply a number by itself: 2⁴ = 2 × 2 × 2 × 2 = 16.",
        "Squaring: 5² = 25. A square root undoes it: √25 = 5.",
        "Any number to the power of 1 is itself, and any non-zero number to the power of 0 is 1.",
        "Watch out: 3² means 3 × 3 = 9, not 3 × 2 = 6." ],
      ex:{ q:"Work out 2³ + √49.", steps:["2³ = 2 × 2 × 2 = 8.", "√49 = 7, because 7 × 7 = 49.", "8 + 7 = 15."] },
      tip:"Learn your squares up to 15² = 225. It's like knowing the shortcut home: it saves you time forever.",
      quiz:[
        { q:"3⁴ = ?", ok:"81", no:["12", "27", "64"], why:"3 × 3 × 3 × 3 = 81." },
        { q:"√81 = ?", ok:"9", no:["40.5", "8", "18"], why:"9 × 9 = 81." },
        { q:"5² + 2² = ?", ok:"29", no:["49", "14", "21"], why:"25 + 4 = 29. (49 would be (5 + 2)², which is different.)" },
        { q:"10³ = ?", ok:"1000", no:["30", "100", "10 000"], why:"10 × 10 × 10 = 1000." },
        { q:"7⁰ = ?", ok:"1", no:["0", "7", "70"], why:"Any non-zero number to the power of 0 is 1." },
        { q:"√50 is between which two whole numbers?", ok:"7 and 8", no:["5 and 6", "6 and 7", "24 and 26"], why:"7² = 49 and 8² = 64, and 50 is between them." } ] },

    { id:"equations", grade:8, title:"Solving equations", short:"solving for x",
      learn:[
        "An equation is a balance. Whatever you do to one side, do to the other.",
        "Undo things in reverse order: first undo the + or −, then undo the × or ÷.",
        "Check your answer by putting it back into the original equation." ],
      ex:{ q:"Solve 3x + 5 = 20.", steps:["Subtract 5 from both sides: 3x = 15.", "Divide both sides by 3: x = 5.", "Check: 3 × 5 + 5 = 20. ✓"] },
      tip:"Solving an equation is like unwrapping a present: the last layer of paper on is the first one off.",
      quiz:[
        { q:"x + 7 = 12. What is x?", ok:"5", no:["19", "−5", "7"], why:"Subtract 7 from both sides: x = 12 − 7 = 5." },
        { q:"4x = 28. What is x?", ok:"7", no:["24", "32", "112"], why:"Divide both sides by 4: x = 28 ÷ 4 = 7." },
        { q:"2x − 3 = 11. What is x?", ok:"7", no:["4", "8", "14"], why:"Add 3 to both sides: 2x = 14. Divide by 2: x = 7." },
        { q:"x ÷ 5 = 6. What is x?", ok:"30", no:["1.2", "11", "6/5"], why:"Multiply both sides by 5: x = 30." },
        { q:"5x + 2 = 3x + 10. What is x?", ok:"4", no:["6", "1.5", "8"], why:"Subtract 3x from both sides: 2x + 2 = 10. Subtract 2: 2x = 8. Divide by 2: x = 4." },
        { q:"What's the easiest first step to solve 6x + 4 = 40?", ok:"Subtract 4 from both sides", no:["Add 4 to both sides", "Multiply both sides by 6", "Subtract 6 from both sides"], why:"Undo the + 4 first. That leaves 6x = 36, then divide by 6 to get x = 6." } ] },

    { id:"expressions", grade:8, title:"Simplifying expressions", short:"like terms and expanding brackets",
      learn:[
        "Like terms have exactly the same letter part: 3x and 5x are like terms, 3x and 3x² are not.",
        "Combine like terms by adding their numbers: 3x + 5x = 8x.",
        "Distributive property: multiply everything inside the brackets: 2(x + 4) = 2x + 8." ],
      ex:{ q:"Simplify 3(x + 2) + 4x − 1.", steps:["Expand the brackets: 3x + 6 + 4x − 1.", "Group like terms: 3x + 4x = 7x, and 6 − 1 = 5.", "Answer: 7x + 5."] },
      tip:"Like terms are like socks: you can only pair up the ones that match.",
      quiz:[
        { q:"Simplify 4a + 3a.", ok:"7a", no:["7a²", "12a", "12a²"], why:"They're like terms, so add the numbers: 4 + 3 = 7. That's 7a." },
        { q:"Simplify 5x + 2 − 3x + 6.", ok:"2x + 8", no:["10x", "8x + 8", "2x − 4"], why:"5x − 3x = 2x, and 2 + 6 = 8." },
        { q:"Expand 3(y − 4).", ok:"3y − 12", no:["3y − 4", "y − 12", "3y + 12"], why:"Multiply both terms by 3: 3 × y = 3y and 3 × (−4) = −12." },
        { q:"Simplify 2(x + 5) + x.", ok:"3x + 10", no:["3x + 5", "2x + 10", "13x"], why:"Expand: 2x + 10 + x. Then 2x + x = 3x." },
        { q:"Which pair are like terms?", ok:"4m and −9m", no:["4m and 4m²", "4m and 4n", "4 and 4m"], why:"Both have exactly the letter m, to the same power." },
        { q:"Expand −2(3x − 1).", ok:"−6x + 2", no:["−6x − 2", "6x − 2", "−6x − 1"], why:"−2 × 3x = −6x, and −2 × (−1) = +2." } ] },

    { id:"pythagoras", grade:8, title:"Pythagorean theorem", short:"Pythagoras",
      learn:[
        "It only works for right triangles (triangles with a 90° angle).",
        "a² + b² = c², where c is the hypotenuse: the longest side, opposite the right angle.",
        "To find the hypotenuse: square the two shorter sides, add them, then take the square root.",
        "To find a shorter side: square the hypotenuse, subtract the other side squared, then take the square root." ],
      ex:{ q:"A right triangle has shorter sides 6 and 8. How long is the hypotenuse?", steps:["6² + 8² = 36 + 64 = 100.", "c² = 100, so c = √100.", "The hypotenuse is 10."] },
      tip:"Builders use 3-4-5 to check a corner is square: measure 3 one way and 4 the other. If the diagonal is 5, it's a perfect right angle.",
      quiz:[
        { q:"The shorter sides are 3 and 4. How long is the hypotenuse?", ok:"5", no:["7", "25", "12"], why:"3² + 4² = 9 + 16 = 25, and √25 = 5." },
        { q:"The shorter sides are 5 and 12. How long is the hypotenuse?", ok:"13", no:["17", "169", "8.5"], why:"5² + 12² = 25 + 144 = 169, and √169 = 13." },
        { q:"The hypotenuse is 10 and one side is 6. How long is the other side?", ok:"8", no:["4", "16", "11.7"], why:"10² − 6² = 100 − 36 = 64, and √64 = 8." },
        { q:"Which side is the hypotenuse?", ok:"The side opposite the right angle", no:["The shortest side", "Any side you like", "The side at the bottom"], why:"The hypotenuse is always opposite the 90° angle, and it's always the longest side." },
        { q:"Does a triangle with sides 6, 7 and 10 have a right angle?", ok:"No, because 6² + 7² isn't 10²", no:["Yes, because 6 + 7 is more than 10", "Yes, every triangle does", "Only if two sides are equal"], why:"6² + 7² = 36 + 49 = 85, but 10² = 100. They don't match, so it isn't a right triangle." },
        { q:"A 13 m ladder leans on a wall with its foot 5 m from the wall. How high up the wall does it reach?", ok:"12 m", no:["8 m", "18 m", "13.9 m"], why:"13² − 5² = 169 − 25 = 144, and √144 = 12." } ] },

    { id:"linear", grade:9, title:"Linear relations", short:"slope and y = mx + b",
      learn:[
        "A linear relation makes a straight line. Its equation looks like y = mx + b.",
        "m is the slope (rise over run): how much y changes when x goes up by 1.",
        "b is the y-intercept: where the line crosses the y-axis, when x = 0.",
        "Slope between two points: (y₂ − y₁) ÷ (x₂ − x₁)." ],
      ex:{ q:"A phone plan costs $20 a month plus $5 per GB: y = 5x + 20. What does 3 GB cost?", steps:["Put x = 3 into the equation: y = 5 × 3 + 20.", "y = 15 + 20 = 35.", "It costs $35."] },
      tip:"Slope is the hill on your bike ride: a big number means a steep climb, and a negative slope means you're coasting downhill.",
      quiz:[
        { q:"In y = 3x + 7, what is the slope?", ok:"3", no:["7", "10", "3x"], why:"In y = mx + b, the slope m is the number in front of x." },
        { q:"In y = 3x + 7, what is the y-intercept?", ok:"7", no:["3", "−7", "0"], why:"In y = mx + b, the y-intercept b is the number on its own." },
        { q:"y = 2x − 1. What is y when x = 4?", ok:"7", no:["9", "8", "3"], why:"2 × 4 − 1 = 8 − 1 = 7." },
        { q:"What is the slope between (1, 2) and (3, 8)?", ok:"3", no:["1/3", "6", "2"], why:"(8 − 2) ÷ (3 − 1) = 6 ÷ 2 = 3." },
        { q:"Which line is steepest?", ok:"y = 5x + 1", no:["y = 2x + 9", "y = x + 20", "y = 0.5x"], why:"The steepest line has the biggest slope, and 5 is the biggest." },
        { q:"A line crosses the y-axis at 4 and has a slope of −2. What is its equation?", ok:"y = −2x + 4", no:["y = 4x − 2", "y = 2x + 4", "y = −2x − 4"], why:"Slope m = −2 and y-intercept b = 4 give y = −2x + 4." } ] },

    { id:"systems", grade:10, title:"Systems of equations", short:"solving two equations together",
      learn:[
        "A system is two equations that are both true at the same time. The solution is where their lines cross.",
        "Substitution: get one letter on its own in one equation, then put that into the other equation.",
        "Elimination: add or subtract the two equations so one letter cancels out.",
        "Always check your answer in both equations." ],
      ex:{ q:"Solve y = x + 1 and x + y = 7.", steps:["Substitute y = x + 1 into the second equation: x + (x + 1) = 7.", "2x + 1 = 7, so 2x = 6 and x = 3.", "y = 3 + 1 = 4. The solution is (3, 4)."] },
      tip:"Two equations and two unknowns are like two clues pointing at the same suspect. Find where they agree.",
      quiz:[
        { q:"Solve y = 2x and x + y = 9.", ok:"(3, 6)", no:["(6, 3)", "(2, 7)", "(4.5, 4.5)"], why:"Substitute: x + 2x = 9, so 3x = 9 and x = 3. Then y = 2 × 3 = 6." },
        { q:"Solve x + y = 10 and x − y = 4.", ok:"(7, 3)", no:["(3, 7)", "(6, 4)", "(5, 5)"], why:"Add the equations: 2x = 14, so x = 7. Then 7 + y = 10, so y = 3." },
        { q:"y = x + 2 and y = 3x − 4. What is x?", ok:"3", no:["1", "−3", "6"], why:"Set them equal: x + 2 = 3x − 4. So 6 = 2x and x = 3." },
        { q:"Is (2, 5) a solution of y = 2x + 1 and x + y = 7?", ok:"Yes, it works in both", no:["Only in the first one", "Only in the second one", "No, it works in neither"], why:"2 × 2 + 1 = 5 ✓ and 2 + 5 = 7 ✓." },
        { q:"To cancel y in 2x + y = 11 and x − y = 1, you should…", ok:"Add the equations", no:["Subtract the equations", "Multiply the first one by 2", "Divide the second one by y"], why:"+y and −y cancel when you add: 3x = 12, so x = 4." },
        { q:"Two parallel lines (same slope, different y-intercepts) have…", ok:"No solution", no:["One solution", "Two solutions", "Infinitely many solutions"], why:"Parallel lines never cross, so there's no point that's on both." } ] },

    { id:"factoring", grade:10, title:"Factoring", short:"factoring expressions",
      learn:[
        "Factoring is expanding in reverse: you turn a sum into a product.",
        "Always look for a common factor first: 6x + 9 = 3(2x + 3).",
        "For x² + bx + c, find two numbers that multiply to c and add to b.",
        "Difference of squares: x² − 25 = (x − 5)(x + 5)." ],
      ex:{ q:"Factor x² + 7x + 12.", steps:["Find two numbers that multiply to 12 and add to 7.", "3 and 4 work: 3 × 4 = 12 and 3 + 4 = 7.", "Answer: (x + 3)(x + 4)."] },
      tip:"Factoring is working out the recipe from the finished cake. Check your answer by expanding it again.",
      quiz:[
        { q:"Factor 4x + 12.", ok:"4(x + 3)", no:["4(x + 12)", "2(2x + 3)", "x(4 + 12)"], why:"4 goes into both terms: 4 × x = 4x and 4 × 3 = 12." },
        { q:"Factor x² + 5x + 6.", ok:"(x + 2)(x + 3)", no:["(x + 1)(x + 6)", "(x + 5)(x + 1)", "(x − 2)(x − 3)"], why:"2 and 3 multiply to 6 and add to 5." },
        { q:"Factor x² − 49.", ok:"(x − 7)(x + 7)", no:["(x − 7)²", "(x − 49)(x + 1)", "(x + 7)²"], why:"It's a difference of squares: 49 = 7², so it's (x − 7)(x + 7)." },
        { q:"Factor x² − x − 12.", ok:"(x − 4)(x + 3)", no:["(x + 4)(x − 3)", "(x − 6)(x + 2)", "(x − 12)(x + 1)"], why:"−4 and 3 multiply to −12 and add to −1." },
        { q:"Factor 3x² + 6x.", ok:"3x(x + 2)", no:["3(x² + 6x)", "x(3x + 2)", "3x(x + 6)"], why:"3x goes into both terms: 3x × x = 3x² and 3x × 2 = 6x." },
        { q:"Which two numbers multiply to 10 and add to −7?", ok:"−2 and −5", no:["2 and 5", "−10 and 1", "−1 and −10"], why:"(−2) × (−5) = 10 and (−2) + (−5) = −7." } ] },

    { id:"trig", grade:10, title:"Trigonometry", short:"SOH CAH TOA",
      learn:[
        "Trig ratios work in right triangles. Name the sides from the angle you're using: opposite, adjacent and hypotenuse.",
        "SOH CAH TOA: sin = opposite ÷ hypotenuse, cos = adjacent ÷ hypotenuse, tan = opposite ÷ adjacent.",
        "Make sure your calculator is in degrees mode.",
        "To find an angle, use the inverse buttons: sin⁻¹, cos⁻¹ or tan⁻¹." ],
      ex:{ q:"The angle is 30° and the hypotenuse is 10. How long is the opposite side?", steps:["Opposite and hypotenuse means SOH: sin 30° = opposite ÷ 10.", "opposite = 10 × sin 30°.", "sin 30° = 0.5, so the opposite side is 5."] },
      tip:"SOH CAH TOA sounds like a dad sneezing. Now you'll never forget it. Sorry.",
      quiz:[
        { q:"What does SOH mean?", ok:"sin = opposite ÷ hypotenuse", no:["sin = opposite × hypotenuse", "sin = adjacent ÷ hypotenuse", "side = opposite + hypotenuse"], why:"S-O-H: Sine is Opposite over Hypotenuse." },
        { q:"The opposite side is 3 and the adjacent side is 4. What is the tan of the angle?", ok:"3/4", no:["4/3", "3/5", "4/5"], why:"tan = opposite ÷ adjacent = 3/4." },
        { q:"The opposite side is 3 and the hypotenuse is 5. What is the sin of the angle?", ok:"3/5", no:["5/3", "4/5", "3/4"], why:"sin = opposite ÷ hypotenuse = 3/5." },
        { q:"The hypotenuse is 20 and the angle is 60°. How long is the adjacent side? (cos 60° = 0.5)", ok:"10", no:["40", "17.3", "0.5"], why:"cos 60° = adjacent ÷ 20, so adjacent = 20 × 0.5 = 10." },
        { q:"Which ratio uses the adjacent side and the hypotenuse?", ok:"cos", no:["sin", "tan", "None of them"], why:"C-A-H: Cosine is Adjacent over Hypotenuse." },
        { q:"tan θ = 1. What is θ?", ok:"45°", no:["1°", "90°", "30°"], why:"In a right triangle with a 45° angle, the opposite and adjacent sides are equal, so tan 45° = 1." } ] },
  ];

  const JOKES = [
    "Why was 6 afraid of 7? Because 7 8 9.",
    "Parallel lines have so much in common. It's a shame they'll never meet.",
    "Why did the student wear glasses in maths class? It improves di-vision.",
    "What do you call friends who love maths? Algebros.",
    "Why is the obtuse triangle always upset? Because it's never right.",
    "I'll do algebra, I'll do trig, I'll even do statistics. But graphing is where I draw the line.",
    "Dear Algebra, please stop asking us to find your x. She's not coming back.",
    "What did the triangle say to the circle? \"You're pointless.\"",
    "Why was the equals sign so humble? It knew it wasn't less than or greater than anyone else.",
    "What's a maths teacher's favourite dessert? Pi.",
    "How do you stay warm in a cold room? Go to the corner. It's 90 degrees.",
    "Why don't you do maths in the jungle? Because if you add 4 + 4, you get ate.",
  ];

  window.MATHS = { topics: T, jokes: JOKES };

  // Coach chats reuse the practice-chat machinery: one "scene" per topic.
  window.LESSONS = window.LESSONS || {};
  window.LESSONS.math = {
    name: "Maths", native: "Maths", voice: "en-CA", hello: "Hi", coach: true,
    lessons: [],
    scenes: T.map(t => ({
      id: t.id, title: t.title, who: "Dad's your maths coach",
      open: `Maths coach mode: ${t.title}. What are you working on? Type the question and tell me what you've tried so far, and we'll crack it together. I'll give you hints, not just the answer, so it actually sticks.`,
      hints: [`Explain ${t.short} like I'm new to it`, "Give me a practice question", "Here's the question I'm stuck on: "],
    })),
  };
})();
