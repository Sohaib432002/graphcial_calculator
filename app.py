from flask import Flask, render_template, request, redirect, url_for, Response
import matplotlib.pyplot as plt
from io import BytesIO
import base64
app = Flask(__name__)
import math
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/linear')
def linear():
    return render_template('index2.html')
@app.route('/submit', methods=['POST'])
def submit():
    if request.method == 'POST':
        m = int(request.form['m'])  # Correct: 'm' matches name attribute in HTML input
        c = int(request.form['C'])  # Correct: 'C' matches name attribute in HTML input
        start_x_valuoe = int(request.form['sx'])  # Correct: 'sx' matches name attribute in HTML input
        end_x_valuoe = int(request.form['EX'])  # Correct: 'EX' matches name attribute in HTML input

        
        if start_x_valuoe < 0 and end_x_valuoe >= 0:
            # if start_x_valuoe<0 and end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            total_x_valuoe = -start_x_valuoe + end_x_valuoe
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : '))
                x = x + 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                y = m * (list_x[i]) + c
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe >= 0 and end_x_valuoe <= 0:
            # if end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            total_x_valuoe = start_x_valuoe - end_x_valuoe
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : ')
                x = x - 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                y = m * (list_x[i]) + c
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe > 0 and end_x_valuoe > 0:
            if start_x_valuoe > end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # total_x_valuoe=start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = m * (list_x[i]) + c
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif start_x_valuoe < end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = m * (list_x[i]) + c
                    list_y.append(y)
                print('Your y values are :', list_y)
            else:
                pass
        elif start_x_valuoe < 0 and end_x_valuoe < 0:
            if end_x_valuoe < start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = m * (list_x[i]) + c
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif end_x_valuoe > start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = m * (list_x[i]) + c
                    list_y.append(y)
                    print('Your y values are :', list_y)
            else:
                pass
        else:
            pass

        

        
        
        
        
        
        # Plotting the graph
        plt.figure(figsize=(8, 6))
        plt.plot(list_x, list_y, label=f'y = {m}x + {c}')
        plt.title('Linear Equation Graph')
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.grid(True)
        plt.legend()
        
        plot_filename = 'static/plot.png'  # Save it in the 'static' folder
        plt.savefig(plot_filename)
        plt.close()

        # Render the template with the graph image
        return render_template('index2_result.html', graph_filename=plot_filename)
    
@app.route('/quadratic')
def quadratic():
    return render_template ('index3.html')

@app.route('/submit_2', methods=['POST'])
def submit_2():
    if request.method == 'POST':
        m = int(request.form['m'])  # Correct: 'm' matches name attribute in HTML input
        n=int(request.form['n'])
        c = int(request.form['C'])  # Correct: 'C' matches name attribute in HTML input
        start_x_valuoe = int(request.form['sx'])  # Correct: 'sx' matches name attribute in HTML input
        end_x_valuoe = int(request.form['EX'])  # Correct: 'EX' matches name attribute in HTML input
        
        a=m
        b=n
        c=c
        
        if start_x_valuoe < 0 and end_x_valuoe >= 0:
            # if start_x_valuoe<0 and end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            total_x_valuoe = -start_x_valuoe + end_x_valuoe
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : '))
                x = x + 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                y = (a * (list_x[i] ** 2)) + b * (list_x[i]) + c
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe >= 0 and end_x_valuoe <= 0:
            # if end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            total_x_valuoe = start_x_valuoe - end_x_valuoe
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : ')
                x = x - 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                y = (a * (list_x[i] ** 2)) + b * (list_x[i]) + c
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe > 0 and end_x_valuoe > 0:
            if start_x_valuoe > end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # total_x_valuoe=start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = (a * (list_x[i] ** 2)) + b * (list_x[i]) + c
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif start_x_valuoe < end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = (a * (list_x[i] ** 2)) + b * (list_x[i]) + c
                    list_y.append(y)
                print('Your y values are :', list_y)
            else:
                pass
        elif start_x_valuoe < 0 and end_x_valuoe < 0:
            if end_x_valuoe < start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = (a * (list_x[i] ** 2)) + b * (list_x[i]) + c
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif end_x_valuoe > start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = (a * (list_x[i] ** 2)) + b * (list_x[i]) + c
                    list_y.append(y)
                    print('Your y values are :', list_y)
            else:
                pass
        else:
            pass
        plt.figure(figsize=(8, 6))
        plt.plot(list_x, list_y, label=f'y = {m}x^2+{n}x + {c}')
        plt.title('Quadratic Equation Graph')
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.grid(True)
        plt.legend()
        
        plot_filename = 'static/plot.png'  # Save it in the 'static' folder
        plt.savefig(plot_filename)
        plt.close()

        # Render the template with the graph image
        return render_template('index3_result.html', graph_filename=plot_filename)
        

@app.route('/third')
def third():
    return render_template('index4.html')

@app.route('/submit_3',methods=['POST'])
def submit_3():
    if request.method == 'POST':
        m = int(request.form['m'])  # Correct: 'm' matches name attribute in HTML input
        n=int(request.form['n'])
        p=int(request.form['p'])
        c = int(request.form['C'])  # Correct: 'C' matches name attribute in HTML input
        start_x_valuoe = int(request.form['sx'])  # Correct: 'sx' matches name attribute in HTML input
        end_x_valuoe = int(request.form['EX'])  # Correct: 'EX' matches name attribute in HTML input
        
        a=m
        b=n
        c=p
        d=c
        if start_x_valuoe < 0 and end_x_valuoe >= 0:
            # if start_x_valuoe<0 and end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            total_x_valuoe = -start_x_valuoe + end_x_valuoe
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : '))
                x = x + 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                y = ((a * (list_x[i] ** 3)) + (b * (list_x[i] ** 2)) + (c * (list_x[i])) + d)
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe >= 0 and end_x_valuoe <= 0:
            # if end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            total_x_valuoe = start_x_valuoe - end_x_valuoe
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : ')
                x = x - 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                y = ((a * (list_x[i] ** 3)) + (b * (list_x[i] ** 2)) + (c * (list_x[i])) + d)
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe > 0 and end_x_valuoe > 0:
            if start_x_valuoe > end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # total_x_valuoe=start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = ((a * (list_x[i] ** 3)) + (b * (list_x[i] ** 2)) + (c * (list_x[i])) + d)
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif start_x_valuoe < end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = ((a * (list_x[i] ** 3)) + (b * (list_x[i] ** 2)) + (c * (list_x[i])) + d)
                    list_y.append(y)
                print('Your y values are :', list_y)
            else:
                pass
        elif start_x_valuoe < 0 and end_x_valuoe < 0:
            if end_x_valuoe < start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = ((a * (list_x[i] ** 3)) + (b * (list_x[i] ** 2)) + (c * (list_x[i])) + d)
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif end_x_valuoe > start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    # y = (a*(list_x[i]**2)) + b*(list_x[i])+c
                    y = ((a * (list_x[i] ** 3)) + (b * (list_x[i] ** 2)) + (c * (list_x[i])) + d)
                    list_y.append(y)
                    print('Your y values are :', list_y)
            else:
                pass
        else:
            pass
        plt.figure(figsize=(8, 6))
        plt.plot(list_x, list_y, label=f'y = {m}x^3+{n}x^2+{p}x+{c}')
        plt.title('Third_degree Equation Graph')
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.grid(True)
        plt.legend()
        
        plot_filename = 'static/plot.png'  # Save it in the 'static' folder
        plt.savefig(plot_filename)
        plt.close()

        # Render the template with the graph image
        return render_template('index4_result.html', graph_filename=plot_filename)

@app.route('/fourth')
def fourth():
    return render_template('index5.html')
@app.route('/submit_4',methods=['POST'])

def submit_4():
    
    if request.method == 'POST':
        m = int(request.form['m'])  # Correct: 'm' matches name attribute in HTML input
        n=int(request.form['n'])
        p=int(request.form['p'])
        q=int(request.form['q'])
        c = int(request.form['C'])  # Correct: 'C' matches name attribute in HTML input
        start_x_valuoe = int(request.form['sx'])  # Correct: 'sx' matches name attribute in HTML input
        end_x_valuoe = int(request.form['EX'])  # Correct: 'EX' matches name attribute in HTML input
        
        a=m
        b=n
        c=p
        d=q
        e=c
        

        if start_x_valuoe < 0 and end_x_valuoe >= 0:
            # if start_x_valuoe<0 and end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            total_x_valuoe = -start_x_valuoe + end_x_valuoe
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : '))
                x = x + 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                y = ((a * (list_x[i] ** 4)) + (b * (list_x[i] ** 3)) + (c * (list_x[i] ** 2)) + (d * (list_x[i])) + e)
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe >= 0 and end_x_valuoe <= 0:
            # if end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            total_x_valuoe = start_x_valuoe - end_x_valuoe
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : ')
                x = x - 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                y = ((a * (list_x[i] ** 4)) + (b * (list_x[i] ** 3)) + (c * (list_x[i] ** 2)) + (d * (list_x[i])) + e)
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe > 0 and end_x_valuoe > 0:
            if start_x_valuoe > end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # total_x_valuoe=start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = ((a * (list_x[i] ** 4)) + (b * (list_x[i] ** 3)) + (c * (list_x[i] ** 2)) + (
                                d * (list_x[i])) + e)
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif start_x_valuoe < end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = ((a * (list_x[i] ** 4)) + (b * (list_x[i] ** 3)) + (c * (list_x[i] ** 2)) + (
                                d * (list_x[i])) + e)
                    list_y.append(y)
                print('Your y values are :', list_y)
            else:
                pass
        elif start_x_valuoe < 0 and end_x_valuoe < 0:
            if end_x_valuoe < start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = ((a * (list_x[i] ** 4)) + (b * (list_x[i] ** 3)) + (c * (list_x[i] ** 2)) + (
                                d * (list_x[i])) + e)
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif end_x_valuoe > start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    y = ((a * (list_x[i] ** 4)) + (b * (list_x[i] ** 3)) + (c * (list_x[i] ** 2)) + (
                                d * (list_x[i])) + e)
                    list_y.append(y)
                    print('Your y values are :', list_y)
            else:
                pass
        else:
            pass
        
        plt.figure(figsize=(8, 6))
        plt.plot(list_x, list_y, label=f'y = {m}x^4+{n}x^3+{p}x^2+{q}x+{c}')
        plt.title('Fourth_degree Equation Graph')
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.grid(True)
        plt.legend()
        
        plot_filename = 'static/plot.png'  # Save it in the 'static' folder
        plt.savefig(plot_filename)
        plt.close()

        # Render the template with the graph image
        return render_template('index5_result.html', graph_filename=plot_filename)



@app.route('/exponential')
def exponential():
    return render_template('index6.html')

@app.route('/submit_5',methods=['POST'])

def submit_5():
    
    if request.method == 'POST':
        m = int(request.form['a'])  # Correct: 'm' matches name attribute in HTML input
        n=int(request.form['b'])
        p=int(request.form['d'])
        q=int(request.form['c'])
        start_x_valuoe = int(request.form['sx'])  # Correct: 'sx' matches name attribute in HTML input
        end_x_valuoe = int(request.form['EX'])  # Correct: 'EX' matches name attribute in HTML input
        
        a=m
        b=n
        d=p
        c=q
        
        if start_x_valuoe < 0 and end_x_valuoe >= 0:
            # if start_x_valuoe<0 and end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            total_x_valuoe = -start_x_valuoe + end_x_valuoe
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : '))
                x = x + 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                # y = (a*(list_x[i]**2)) + b*(list_x[i])+c
                y = (a ** (b * (list_x[i]) + d) + c)
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe >= 0 and end_x_valuoe <= 0:
            # if end_x_valuoe==0:
            list_x = []
            list_y = []
            x = start_x_valuoe
            list_x.append(x)
            total_x_valuoe = start_x_valuoe - end_x_valuoe
            # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
            for i in range(total_x_valuoe):
                # x = eval (input ('Enter  x value : ')
                x = x - 1
                list_x.append(x)
            print('Your x values are :', list_x)
            for i in range(len(list_x)):
                # y = (a*(list_x[i]**2)) + b*(list_x[i])+c
                y = (a ** (b * (list_x[i]) + d) + c)
                list_y.append(y)
            print('Your y values are :', list_y)
        elif start_x_valuoe > 0 and end_x_valuoe > 0:
            if start_x_valuoe > end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # total_x_valuoe=start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')

                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    # y = (a*(list_x[i]**2)) + b*(list_x[i])+c
                    y = (a ** (b * (list_x[i]) + d) + c)
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif start_x_valuoe < end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                start_x_valuoe = float(start_x_valuoe)
                end_x_valuoe = float(end_x_valuoe)
                for i in range(start_x_valuoe, end_x_valuoe, 1):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    # y = (a*(list_x[i]**2)) + b*(list_x[i])+c
                    y = (a ** (b * (list_x[i]) + d) + c)
                    list_y.append(y)
                print('Your y values are :', list_y)
            else:
                pass
        elif start_x_valuoe < 0 and end_x_valuoe < 0:
            if end_x_valuoe < start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    # y = (a*(list_x[i]**2)) + b*(list_x[i])+c
                    y = (a ** (b * (list_x[i]) + d) + c)
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif end_x_valuoe > start_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # end_x_valuoe_final=-start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    # y = (a*(list_x[i]**2)) + b*(list_x[i])+c
                    y = (a ** (b * (list_x[i]) + d) + c)
                    list_y.append(y)
                    print('Your y values are :', list_y)
            else:
                pass
        else:
            pass
        plt.figure(figsize=(8, 6))
        plt.plot(list_x, list_y, label=f'y = {a}^(bx+{d})x+{c}')
        plt.title('Exponential Equation Graph')
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.grid(True)
        plt.legend()
        
        plot_filename = 'static/plot.png'  # Save it in the 'static' folder
        plt.savefig(plot_filename)
        plt.close()

        # Render the template with the graph image
        return render_template('index6_result .html', graph_filename=plot_filename)



@app.route('/log')
def log():
   return render_template('index7.html')


@app.route('/submit_6',methods=['POST'])

def submit_6():
    
    if request.method == 'POST':
        m = int(request.form['m'])  # Correct: 'm' matches name attribute in HTML input
        start_x_valuoe = int(request.form['sx'])  # Correct: 'sx' matches name attribute in HTML input
        end_x_valuoe = int(request.form['EX'])  # Correct: 'EX' matches name attribute in HTML input
        base=m
        if start_x_valuoe > 0 and end_x_valuoe > 0:
            if start_x_valuoe > end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # total_x_valuoe=start_x_valuoe-end_x_valuoe
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe, -1):
                    # x = eval (input ('Enter  x value : '))
                    x = x - 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    import math

                    y = math.log(list_x[i], base)
                    list_y.append(y)
                print('Your y values are :', list_y)
            elif start_x_valuoe < end_x_valuoe:
                list_x = []
                list_y = []
                x = start_x_valuoe
                list_x.append(x)
                # print('Enter ', i, 'x value (max value', total_x_valuoe, ')')
                for i in range(start_x_valuoe, end_x_valuoe):
                    # x = eval (input ('Enter  x value : '))
                    x = x + 1
                    list_x.append(x)
                print('Your x values are :', list_x)
                for i in range(len(list_x)):
                    import math

                    y = math.log(list_x[i], base)
                    list_y.append(y)
                print('Your y values are :', list_y)
            else:
                pass
        else:
            pass
        plt.figure(figsize=(8, 6))
        plt.plot(list_x, list_y, label=f'y = log{base}x')
        plt.title('Exponential Equation Graph')
        plt.xlabel('X')
        plt.ylabel('Y')
        plt.grid(True)
        plt.legend()
        
        plot_filename = 'static/plot.png'  # Save it in the 'static' folder
        plt.savefig(plot_filename)
        plt.close()

        # Render the template with the graph image
        return render_template('index7_result.html', graph_filename=plot_filename)

        

if __name__ == '__main__':
    app.run(debug=True)
